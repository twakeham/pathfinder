from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Conversation

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser):
            await self.close()
            return
        # Verify ownership
        allowed = await self._owns_conversation(user.id, self.conversation_id)
        if not allowed:
            await self.close()
            return
        self.group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Echo message payloads to group; generation can be handled server-side
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "chat.message", "payload": content}
        )

    async def chat_message(self, event):
        await self.send_json(event.get('payload', {}))

    @database_sync_to_async
    def _owns_conversation(self, user_id, convo_id):
        try:
            return Conversation.objects.filter(id=convo_id, owner_id=user_id).exists()
        except Exception:
            return False
