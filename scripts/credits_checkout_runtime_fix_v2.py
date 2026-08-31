from pathlib import Path

p=Path('scripts/credits_checkout_v1.py')
s=p.read_text(encoding='utf-8')
old="moy_m=re.search(r\"publishable_api_key\\s*:\\s*['\\\"]([^'\\\"]+)['\\\"]\",s)"
new="payment_source=Path('payment.html').read_text(encoding='utf-8') if Path('payment.html').exists() else s\nmoy_m=re.search(r\"(?:publishable_api_key\\s*:\\s*|const\\s+MOYASAR_KEY\\s*=\\s*)['\\\"]([^'\\\"]+)['\\\"]\",payment_source)"
if old not in s:
    raise SystemExit('credits checkout config marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Credit checkout config discovery fixed')
