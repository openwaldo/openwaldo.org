---
title: Why OpenWALDO exists
type: blog
author: Gregory M. Kurtzer
description: Why I started OpenWALDO. What thirty years of open source taught me, what AI is missing, and why the fix is a commons, not another model.
---

# Background

A quick introduction: I'm Greg. I've done quite a bit in open source over my
career, and I'm a very strong advocate and supporter of it. I've been part of
many projects over the years and even had the opportunity to create some
(chronologically):

* [Warewulf](https://warewulf.org/): the cluster provisioning and management
  system that has been deploying HPC systems since 2001
* [CentOS](https://www.centos.org/): the free, community rebuild of
  Enterprise Linux that ended up running a huge chunk of the internet
* [Apptainer](https://apptainer.org/) (formerly Singularity Containers):
  containers built for HPC and scientific computing, now part of the Linux
  Foundation
* [Rocky Linux](https://rockylinux.org/) and the [RESF](https://www.resf.org/):
  the community's answer when CentOS changed course, and the foundation that
  keeps it community-owned
* [OpenELA](https://openela.org/): an association publishing the sources that
  Enterprise Linux distributions need to stay open

I did all of these because I like solving real problems and pain points for
people, together with a community that enjoys collaborating. And I started
[OpenWALDO](https://openwaldo.org/) because AI has exactly the kind of
problem that open source communities exist to solve. Let me explain.

Like many fans of open source, I've seen amazing things come out of open,
collaborative development. I've also seen some tremendous failures,
especially when companies monetize their open source communities
incorrectly.

But many times the worst problems are when things that should be open
source, or community driven, are not. I am 100% not against companies having
closed IP and trade secrets; they have to build value. But a lot of
companies try to monetize not just the unique value they bring, but also the
foundation that everyone needs. Them, their competitors, and the community.
That foundation is the perfect place for open source collaboration!

# Training an AI model

When an AI model is created, it ingests TONS of training data. The more
different types of data, the "smarter" the model can get.

So training labs are scouring the internet for as much data as they can
find. Much of it is freely available to use. Some of it can cause problems
for the lab, or for you, if it ever comes to light. And there's plenty of
finger pointing right now over labs allegedly training on data generated
from each other's models (distilling).

The data, or "source," of a model is absolutely critical: the capability and
output of a model is 100% a derivative of the source data going into it.
Without the source data, there is no model. This works very much like
programming, just at a very different scale.

# The source code of a model

Software starts as source code, which is what a programmer actually writes.
That source gets compiled or interpreted into executable machine code, the
"binary" that gets shared and distributed (think ".exe"). The binary is a
derivative of the source, and the source is literally everything that went
into that binary.

That relationship, source to binary, is exactly the relationship between
training data and model weights.

The data quite literally is the source code of the AI model.

# The "open source" AI models

Now let's apply that source and binary framework to the models being
released today.

When a lab releases a model as "open," what it's actually releasing is the
weights: the binary. Often the weights really do carry a genuinely open
license, Apache or MIT, and you can download them, run them, fine-tune them,
and ship them in products. That's genuinely useful, and it's easy to see why
people reach for the words "open source" to describe it.

But remember what open source means, it means you freely get the source. But with
these "open" models, the source, meaning the training data, stays behind closed
doors. We can't see what went in, we can't audit it, and we can't rebuild the
model from it. Measured against the definition that has served software for
decades, an open-weight model is a freely distributable binary. Useful, yes.
Open source, no.

There are honorable mentions worth knowing about. AI2's OLMo publishes its
training data alongside its weights, and EleutherAI trained Comma entirely
on openly licensed text. Both deserve real credit. Even then, those are
dataset releases from single labs, snapshots rather than a living commons
anyone can contribute to.

None of this means companies are obligated to open everything (or anything);
that's their call to make. The point is simpler: words matter. When "open
source" gets attached to models nobody can see into, the term starts losing
the meaning that made it trustworthy in the first place.

# Here's what I'm seeing...

Some say these "open" models are dangerous because we don't know what's in
them. Others are rallying to defend open source itself.

There is truth in both of these positions! The opacity is real: nobody
outside a lab can say what any given model learned from, and that should
bother you whether you love these models or fear them. And defending open
source is right too; the term has a meaning worth protecting, and it built
most of the software world we all rely on. The trouble is that the thing
being defended, in this case, isn't actually open source.

Opening the data is indeed necessary, but it still isn't enough on its own.
Even if a model starts from a fully open foundation, nothing stops anyone
from training on top of it with whatever else they want. Unless the
training record is open too, we still wouldn't know what's inside.

So the answer has to be both halves working together: an open source
training foundation, with data curated and licensed in the open, and a
verifiable record of what each model was actually trained on, a training
bill of materials. The foundation makes good models possible. The record
makes them provable.

# The solution

The simple version first: treat the AI source exactly like open source
code. A community contributes it, reviews it, and licenses it, and anyone
can build with it.

Now the mechanics. Tools like git already do this at planet scale for
software, but they're built for text, not petabytes of training data. So
OpenWALDO splits the job. A git repository holds the index: the metadata,
manifests, licenses, and checksums, all small and human-reviewable. The
actual data lives in object storage hosted by the contributors themselves,
and the index references every blob by checksum, so integrity and provenance
can always be verified. Git plus a lookaside cache, scaled for AI.

Contributions work the way big open source projects already work: each one
is signed off under the Developer Certificate of Origin (DCO), submitted as
a pull request, tested for awesomeness, and merged. Strong, auditable
provenance, running on a process the industry has trusted for twenty years.

Couple that with properly licensed and audited data, and we have a corpus of
knowledge that everyone can train on. And models trained from it can carry a
verifiable record, a bill of materials listing exactly which sources went
in. That's the other half of trust: not just open source, but provable
ingredients. [How it works](https://openwaldo.org/how.html) goes deeper.

# Who cares?

Two groups, generally. Those building and releasing AI models, whether
"open" or closed, who get a common, safe base layer instead of re-collecting
the same data as everyone else. And those who want specific knowledge
represented in AI: companies who want their products known by the models,
individuals offering their work, governments, libraries, anyone.

# Why not just use an existing corpus of data?

There are places to get training data, some quite large (e.g., the Common
Pile), and those projects have done an amazing job pulling together
trillions of tokens. OpenWALDO already ingests from them. What they don't
provide is the commons part: per-document license strictness, tracked
provenance, and a trusted way for anyone to contribute. They deserve tons of
credit, and they live on inside OpenWALDO.

# What is the status of the project?

Very early. I'm still figuring out some of the nuances, but the skeleton is
done: it works, [people can contribute](https://openwaldo.org/community.html),
and people can train models on what's there today. Transparently, what we
have so far is barely the tip of the iceberg compared to what will be
needed. [The front page](https://openwaldo.org/) counts the corpus in real
time.

# The goal

I believe this project can reach tens of trillions of tokens, which is more
than enough to train very large models, and eventually be additive to
frontier models.

That verifiable record deserves to become a standard: an AI Bill of
Materials (AIBOM) that states exactly what went into a model. That lets any
AI provider build from precisely the license profile they choose. Include
Copyleft or exclude it; either way it's your call, per shard, on the record.
That choice simply doesn't exist anywhere else today.

# The invitation

Let's work together on this!

A corpus where contributors control what goes in, and AI providers get a
common, open, and safe foundation, so they can focus on the real value-add
in their models. That's what open source looks like when it's applied to AI.

[See ya in the Slack!](https://join.slack.com/t/openwaldo/shared_invite/zt-44vpjma2b-FaOktN~r6dsZ_PbECGRi0g)

Greg
