import json
from channels.generic.websocket import AsyncWebsocketConsumer

class IssueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'issues_group'

        # Join room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def issue_update(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
