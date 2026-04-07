from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import math

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon/2)**2)
    return R * 2 * math.asin(math.sqrt(a))

@api_view(['POST'])
def calculate_fare(request):
    print("CONTENT_TYPE:", request.content_type)
    print("DATA:", request.data)
    d = request.data
    if not d:
        return Response({'error': 'empty body'}, status=status.HTTP_400_BAD_REQUEST)
    distance_km = haversine_km(
        float(d['pickup_lat']), float(d['pickup_lng']),
        float(d['dropoff_lat']), float(d['dropoff_lng'])
    )
    fare = 40.00 + (max(0, distance_km - 4) * 10.00)
    return Response({
        'distance_km': round(distance_km, 2),
        'fare_php': round(fare, 2)
    })