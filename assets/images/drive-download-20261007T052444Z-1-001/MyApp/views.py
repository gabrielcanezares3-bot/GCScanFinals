from django.shortcuts import render
from .models import BabyProduct

def dashboard(request):
    products = BabyProduct.objects.all()

    return render(request, 'BabyProduct/dashboard.html', {
    'products': products
})

