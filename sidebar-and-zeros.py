import io, re, glob, os
os.chdir(os.path.dirname(os.path.abspath(__file__)) if os.path.basename(os.getcwd())!='acq-pro' else '.')
BLOG='client/public/blog'
changed=[]

# 1. leadership post: sidebar points at Contracts, article is about PM leadership
f=f'{BLOG}/leadership-in-defense-pm-its-a-people-business.html'
s=io.open(f,encoding='utf-8').read()
if 'Defense Contracting Fundamentals' in s:
    s=s.replace('Defense Contracting Fundamentals','Program Operations &amp; Leadership')
    s=s.replace('Contract types, source selection, IDIQs, GWACs, modifications, and the COR role.',
                'Risk management, stakeholder comms, CMMI, subcontractor management, and career roadmaps.')
    io.open(f,'w',encoding='utf-8').write(s); changed.append('leadership post sidebar -> Operations & Leadership')
else:
    changed.append('leadership post sidebar: already correct')

# 2. drop leading zeros in Module labels, published posts + the generator
n=0
for f in glob.glob(f'{BLOG}/*.html')+['scripts/generate_blog_post.py']:
    s=io.open(f,encoding='utf-8').read()
    t=re.sub(r'Module 0([1-6])', r'Module \1', s)
    if t!=s:
        io.open(f,'w',encoding='utf-8').write(t); n+=1
changed.append(f'leading zeros removed in {n} files')

for c in changed: print(' -', c)
