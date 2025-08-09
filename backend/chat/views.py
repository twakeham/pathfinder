from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from ai_models.services import EchoModel, OpenAIModel, ChatMessage
from django.conf import settings


class IsOwner(permissions.BasePermission):
	def has_object_permission(self, request, view, obj):
		if isinstance(obj, Conversation):
			return obj.owner_id == request.user.id
		if isinstance(obj, Message):
			return obj.conversation.owner_id == request.user.id
		return False


class ConversationViewSet(viewsets.ModelViewSet):
	serializer_class = ConversationSerializer
	permission_classes = [permissions.IsAuthenticated, IsOwner]

	def get_queryset(self):
		return Conversation.objects.filter(owner=self.request.user)

	def perform_create(self, serializer):
		serializer.save(owner=self.request.user)

	@action(detail=True, methods=['get', 'post'])
	def messages(self, request, pk=None):
		convo = self.get_object()
		if request.method.lower() == 'get':
			qs = convo.messages.all()
			return Response(MessageSerializer(qs, many=True).data)
		# POST: create a message in this conversation (no generation yet)
		data = request.data.copy()
		serializer = MessageSerializer(data=data)
		serializer.is_valid(raise_exception=True)
		serializer.save(conversation=convo)
		return Response(serializer.data, status=status.HTTP_201_CREATED)

	@action(detail=True, methods=['post'])
	def generate(self, request, pk=None):
		"""Append a user message and generate assistant reply via provider."""
		convo = self.get_object()
		data = request.data or {}
		text = data.get('content', '')
		if not text.strip():
			return Response({'detail': 'content is required'}, status=400)
		# Create the user message
		user_msg = Message.objects.create(conversation=convo, role='user', content=text)
		# Build history and call provider
		history = [ChatMessage(role=m.role, content=m.content) for m in convo.messages.all()]
		# Parameters with safe defaults and bounds
		model = data.get('model') or None
		try:
			temperature = float(data.get('temperature', 0.7))
		except Exception:
			temperature = 0.7
		try:
			top_p = float(data.get('top_p', 1.0))
		except Exception:
			top_p = 1.0
		try:
			max_tokens = int(data.get('max_tokens', 512))
		except Exception:
			max_tokens = 512
		# Clamp to safe ranges
		temperature = max(0.0, min(1.0, temperature))
		top_p = max(0.0, min(1.0, top_p))
		max_tokens = max(1, min(2048, max_tokens))
		# Decide provider
		force = (request.query_params.get('provider') or '').lower().strip()
		want_openai = force == 'openai' or getattr(settings, 'USE_OPENAI', False)
		provider_used = 'echo'
		if want_openai:
			try:
				provider = OpenAIModel()
				provider_used = 'openai'
			except Exception as e:
				# Make the failure visible instead of silently echoing
				return Response({'detail': 'OpenAI provider not available', 'error': str(e)}, status=502)
		else:
			provider = EchoModel()
		reply = provider.chat(history, model=model, temperature=temperature, top_p=top_p, max_tokens=max_tokens)
		asst_msg = Message.objects.create(conversation=convo, role='assistant', content=reply.content)
		return Response({
			'user': MessageSerializer(user_msg).data,
			'assistant': MessageSerializer(asst_msg).data,
			'provider_used': provider_used,
		}, status=201)


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
	serializer_class = MessageSerializer
	permission_classes = [permissions.IsAuthenticated, IsOwner]

	def get_queryset(self):
		return Message.objects.filter(conversation__owner=self.request.user)
