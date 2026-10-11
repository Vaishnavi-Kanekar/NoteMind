# backend/notes_api/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from pgvector.django import VectorField

class User(AbstractUser):
    """
    Model 1: Custom user model.
    """
    pass


class UploadedFile(models.Model):
    """
    Model 2: Tracks the structural document/image files uploaded by a student.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    
    filename = models.CharField(max_length=255)
    
    # NEW FIELD: Tracks the academic subject for filtering and organization
    subject = models.CharField(max_length=150, default="General") 
    
    file_path = models.CharField(max_length=500)  # Path where the file is physically stored
    file_type = models.CharField(max_length=50)   # e.g., "application/pdf", "image/png"
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} ({self.subject}) - Uploaded by {self.user.username}"


class NoteChunk(models.Model):
    """
    Model 3: Stores sliced blocks of extracted text alongside their 
    mathematical vector representation for semantic search.
    """
    file = models.ForeignKey(UploadedFile, on_delete=models.CASCADE, related_name='chunks')
    chunk_text = models.TextField()
    chunk_index = models.IntegerField()
    embedding = VectorField(dimensions=384, null=True, blank=True)

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.file.filename}"
