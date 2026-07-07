from django.urls import path
from . import views

app_name = 'locations'

urlpatterns = [
    path('', views.home, name='home'),
    path('explore/', views.explore, name='explore'),
    path('city/<int:pk>/', views.city_detail, name='city_detail'),
    path('filter/', views.filter_locations, name='filter_locations'),
    path('sandbox/', views.sandbox, name='sandbox'),
]
