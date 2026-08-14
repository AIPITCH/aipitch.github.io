---
layout: default
title: News
description: The latest news and updates from the AIPITCH project.
permalink: /news/
---
<header class="page-hero">
  <div class="container">
    <p class="eyebrow light">Updates from AIPITCH</p>
    <h1>Project news</h1>
    <p>Follow the latest milestones, research and activities from the AIPITCH consortium.</p>
  </div>
</header>

<section class="section news-list">
  <div class="container">
    {% if site.posts.size > 0 %}
      {% for post in site.posts %}
        <article class="news-card">
          <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %-d, %Y" }}</time>
          <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
          <p>{{ post.excerpt | strip_html | normalize_whitespace }}</p>
          <a class="source-link" href="{{ post.url | relative_url }}">Read the update <span>→</span></a>
        </article>
      {% endfor %}
    {% else %}
      <p>No news has been published yet.</p>
    {% endif %}
  </div>
</section>
