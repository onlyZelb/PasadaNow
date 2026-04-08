from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import math

FARE_RULES = {
    'Trike':  {'base': 40, 'per_km': 10, 'free_km': 4},
    'Tricab': {'base': 55, 'per_km': 12, 'free_km': 4},
}

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

    fare_type = d.get('fare_type', 'Trike')
    rules = FARE_RULES.get(fare_type, FARE_RULES['Trike'])

    distance_km = haversine_km(
        float(d['pickup_lat']), float(d['pickup_lng']),
        float(d['dropoff_lat']), float(d['dropoff_lng'])
    )

    fare = rules['base'] + (max(0, distance_km - rules['free_km']) * rules['per_km'])

    return Response({
        'distance_km': round(distance_km, 2),
        'fare_php':    round(fare, 2),
        'fare_type':   fare_type
    })