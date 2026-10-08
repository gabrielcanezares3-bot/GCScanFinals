from django.db import models

# Create your models here.

class BabyProduct(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField()
    size = models.CharField(max_length=30)
    color = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.product_id} - {self.product_name}"
