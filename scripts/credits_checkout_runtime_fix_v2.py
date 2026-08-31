from pathlib import Path

p=Path('scripts/credits_checkout_v1.py')
s=p.read_text(encoding='utf-8')

# The credit builder runs after payment_standalone_v3, which moves checkout
# configuration into payment.html. Read all public values from either source.
old="url_m=re.search(r\"const\\s+SUPABASE_URL\\s*=\\s*['\\\"]([^'\\\"]+)['\\\"]\",s)\nkey_m=re.search(r\"const\\s+SUPABASE_PUBLISHABLE_KEY\\s*=\\s*['\\\"]([^'\\\"]+)['\\\"]\",s)\nmoy_m=re.search(r\"publishable_api_key\\s*:\\s*['\\\"]([^'\\\"]+)['\\\"]\",s)"
new="payment_source=Path('payment.html').read_text(encoding='utf-8') if Path('payment.html').exists() else ''\nconfig_source=s+'\\n'+payment_source\nurl_m=re.search(r\"const\\s+SUPABASE_URL\\s*=\\s*['\\\"]([^'\\\"]+)['\\\"]\",config_source)\nkey_m=re.search(r\"const\\s+(?:SUPABASE_PUBLISHABLE_KEY|SUPABASE_KEY)\\s*=\\s*['\\\"]([^'\\\"]+)['\\\"]\",config_source)\nmoy_m=re.search(r\"(?:publishable_api_key\\s*:\\s*|const\\s+MOYASAR_KEY\\s*=\\s*)['\\\"]([^'\\\"]+)['\\\"]\",config_source)"
if old not in s:
    raise SystemExit('credits checkout config block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Credit checkout public config discovery fixed completely')
