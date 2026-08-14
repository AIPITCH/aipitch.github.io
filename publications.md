---
layout: default
title: Publications
description: Academic papers and preprints published by members of the AIPITCH consortium.
permalink: /publications/
---
<header class="page-hero">
  <div class="container">
    <p class="eyebrow light">AIPITCH research</p>
    <h1>Publications</h1>
    <p>Explore academic papers and preprints produced by members of the AIPITCH consortium.</p>
  </div>
</header>
<section class="section publication-list"><div class="container">
  {% assign publications = site.publications | sort: "date" | reverse %}
  {% for publication in publications %}
  <article class="publication-card">
    <div class="publication-card-main">
      <div class="publication-badges"><span>{{ publication.kind | default: "Publication" }}</span>{% if publication.status %}<span>{{ publication.status }}</span>{% endif %}</div>
      <h2><a href="{{ publication.url | relative_url }}">{{ publication.title }}</a></h2>
      <p class="publication-authors">{{ publication.authors | join: ", " }}</p>
      <p>{{ publication.summary }}</p>
    </div>
    <div class="publication-card-meta">
      {% if publication.date %}<div><span>Published</span><strong>{{ publication.date | date: "%B %Y" }}</strong></div>{% endif %}
      {% if publication.doi %}<div><span>DOI</span><a href="https://doi.org/{{ publication.doi }}" rel="noopener" target="_blank">{{ publication.doi }} ↗</a></div>{% endif %}
      <a class="source-link" href="{{ publication.url | relative_url }}">Publication details <span>→</span></a>
    </div>
  </article>
  {% endfor %}
</div></section>
