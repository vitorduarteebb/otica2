from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('otica_app', '0013_sale_cliente'),
    ]

    operations = [
        migrations.AddField(
            model_name='cliente',
            name='grau_od',
            field=models.CharField('Grau OD', max_length=50, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='grau_oe',
            field=models.CharField('Grau OE', max_length=50, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='dnp_od',
            field=models.CharField('DNP OD', max_length=20, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='dnp_oe',
            field=models.CharField('DNP OE', max_length=20, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='adicao',
            field=models.CharField('Adição', max_length=20, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='observacoes_opticas',
            field=models.TextField('Observações Ópticas', blank=True, null=True),
        ),
    ] 