from django.urls import path
from .views import EarningsListView, EarningsSummaryView

urlpatterns = [
    path('list',    EarningsListView.as_view()),
    path('summary', EarningsSummaryView.as_view()),
]
