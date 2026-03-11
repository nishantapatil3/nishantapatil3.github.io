---
title: Progressive Delivery Solution for Cisco Calisti
date: 2022-06-28
---

<pre><code class="language-plaintext hljs" data-highlighted="yes">{"msg":"New revision detected! Scaling up podinfo.test","canary":"podinfo.test"}
{"msg":"Starting canary analysis for podinfo.test","canary":"podinfo.test"}
{"msg":"Advance podinfo.test canary weight 20","canary":"podinfo.test"}
{"msg":"Advance podinfo.test canary weight 40","canary":"podinfo.test"}
{"msg":"Advance podinfo.test canary weight 60","canary":"podinfo.test"}
{"msg":"Halt podinfo.test advancement request duration 917ms &gt; 500ms","canary":"podinfo.test"}
{"msg":"Halt podinfo.test advancement request duration 598ms &gt; 500ms","canary":"podinfo.test"}
{"msg":"Halt podinfo.test advancement request duration 1.543s &gt; 500ms","canary":"podinfo.test"}
{"msg":"Rolling back podinfo.test failed checks threshold reached 3","canary":"podinfo.test"}
{"msg":"Canary failed! Scaling down podinfo.test","canary":"podinfo.test"}</code></pre>


---

Reposted from Outshift: https://outshift.cisco.com/blog/progressive-delivery-calisti
