# Generated by Django 4.2.7 on 2025-06-20 16:07

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('otica_app', '0008_cashflow_cash_till_session'),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_name', models.CharField(max_length=200, verbose_name='Nome do Cliente')),
                ('customer_phone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Telefone do Cliente')),
                ('sphere_right', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Esférico (OD)')),
                ('cylinder_right', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Cilíndrico (OD)')),
                ('axis_right', models.IntegerField(blank=True, null=True, verbose_name='Eixo (OD)')),
                ('addition_right', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Adição (OD)')),
                ('dnp_right', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='DNP (OD)')),
                ('height_right', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Altura (OD)')),
                ('sphere_left', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Esférico (OE)')),
                ('cylinder_left', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Cilíndrico (OE)')),
                ('axis_left', models.IntegerField(blank=True, null=True, verbose_name='Eixo (OE)')),
                ('addition_left', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Adição (OE)')),
                ('dnp_left', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='DNP (OE)')),
                ('height_left', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name='Altura (OE)')),
                ('lens_description', models.TextField(blank=True, verbose_name='Descrição das Lentes')),
                ('frame_description', models.TextField(blank=True, verbose_name='Descrição da Armação')),
                ('notes', models.TextField(blank=True, verbose_name='Observações')),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Preço Total')),
                ('status', models.CharField(choices=[('realizando', 'Realizando'), ('pronto', 'Pronto'), ('entregue', 'Entregue')], default='realizando', max_length=20, verbose_name='Status')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Data de Atualização')),
                ('seller', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='otica_app.seller', verbose_name='Vendedor')),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='otica_app.store', verbose_name='Loja')),
            ],
            options={
                'verbose_name': 'Pedido',
                'verbose_name_plural': 'Pedidos',
                'ordering': ['-created_at'],
            },
        ),
    ]
