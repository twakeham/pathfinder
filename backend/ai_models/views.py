from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .services import EchoModel, ChatMessage


class ChatGenerateView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		# Expect messages: [{role, content}, ...]
		messages = request.data.get('messages') or []
		norm = [ChatMessage(role=m.get('role', 'user'), content=m.get('content', '')) for m in messages if isinstance(m, dict)]
		model_name = request.data.get('model')
		ai = EchoModel()
		out = ai.chat(norm, model=model_name)
		return Response({
			'role': out.role,
			'content': out.content,
		}, status=status.HTTP_200_OK)
