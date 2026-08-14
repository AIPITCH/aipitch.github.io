---
layout: default
title: Our work
description: Open-source software, research and other contributions developed by the AIPITCH consortium.
permalink: /projects/
---
<header class="page-hero">
  <div class="container">
    <p class="eyebrow light">The AIPITCH toolkit</p>
    <h1>Our contributions</h1>
    <p>Explore the open-source software, research and practical resources created by members of the AIPITCH consortium.</p>
  </div>
</header>
<section class="section project-list"><div class="container">
  {% assign projects = site.projects | sort: "title" %}
  {% for project in projects %}
  <article class="project-card">
    <div><p class="eyebrow">{{ project.kind | default: "AIPITCH contribution" }}</p><h2><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h2><p>{{ project.summary }}</p></div>
    <div class="project-card-foot"><span>By <strong>{{ project.member }}</strong></span><a class="source-link" href="{{ project.url | relative_url }}">Explore the project <span>→</span></a></div>
  </article>
  {% endfor %}
  <aside class="contribute-callout"><div><p class="eyebrow light">For consortium members</p><h2>Share your contribution.</h2></div><div><p>This catalogue is designed to grow with the project. Add software, datasets, research outputs or other reusable resources by following the contribution guide.</p><a class="button button-light" href="https://github.com/AIPITCH/aipitch.github.io/blob/main/CONTRIBUTING.md" rel="noopener" target="_blank">Contribution guide ↗</a></div></aside>
</div></section>
