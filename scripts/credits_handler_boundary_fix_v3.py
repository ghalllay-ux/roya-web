from pathlib import Path

p=Path('scripts/credits_checkout_v1.py')
s=p.read_text(encoding='utf-8')
old="hend=s.find('\\nwindow.addEventListener(\\'load\\'', hstart)"
new="hend=s.find('\\n\\nasync function logoutAllDevices(){', hstart)"
if old not in s:
    raise SystemExit('credit handler boundary marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Credit payment handler boundary fixed; core auth runtime preserved')
