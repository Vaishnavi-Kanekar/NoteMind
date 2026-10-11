from django.urls import path
from .views import SignupView, ProfileView, FileUploadAndProcessView,FileListView,FileDownloadView,FileViewView, ChatQueryView
urlpatterns = [
    path('signup/', SignupView.as_view()),
    path('profile/', ProfileView.as_view()),
    #Appended our modular cleaning/chunking file pipeline right below:
    path('files/upload/', FileUploadAndProcessView.as_view()),
    path("files/",FileListView.as_view()),
    path("files/<int:file_id>/download/", FileDownloadView.as_view()),
    path("files/<int:file_id>/view/", FileViewView.as_view()),
    path('chat/query/', ChatQueryView.as_view())
]
