from django.conf import settings
from django.db import models


class Conversation(models.Model):
	"""A chat conversation owned by a user."""
	owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
	title = models.CharField(max_length=200, blank=True, default='')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-updated_at', '-id']

	def __str__(self):
		return self.title or f"Conversation {self.pk}"


class Message(models.Model):
	"""A message within a conversation."""
	ROLE_CHOICES = [
		('system', 'System'),
		('user', 'User'),
		('assistant', 'Assistant'),
	]
	conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
	role = models.CharField(max_length=20, choices=ROLE_CHOICES)
	content = models.TextField()
	model = models.CharField(max_length=100, blank=True, default='')
	prompt_tokens = models.IntegerField(null=True, blank=True)
	completion_tokens = models.IntegerField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['id']

	def __str__(self):
		return f"{self.role}: {self.content[:30]}"
