---
title: Training tiny AI models
type: blog
author: Gregory M. Kurtzer
description: What OpenWALDO's tiny-model experiments teach about corpus breadth, model capacity, acceptance criteria, and sharing the training process in the open.
---

# Training tiny AI models

Small models make training experiments more accessible. They provide a way to
explore architectures, training methods, and capability targets before committing
resources to larger runs.

But reducing model size also requires reconsidering the task represented by the
training data. A smaller slice of a broad corpus can still contain a broad range
of language, topics, and capabilities.

The amount of data has changed. The breadth of the problem may remain much the
same.

# Data volume and corpus breadth

Data volume describes how much material a model receives. Corpus breadth
describes the range of material it is expected to learn from.

These are separate choices.

A small selection from a diverse corpus can still ask a model to represent many
different kinds of knowledge and behavior. For a tiny model with limited
capacity, that breadth can become an important variable to investigate.

Changing architecture, parameter count, training duration, epochs, or data volume
may leave that variable largely untouched.

Narrowing the training material creates a more focused experiment. Language,
topics, and intended capabilities can be selected deliberately while keeping the
material useful and coherent.

The aim is an appropriate mixture for the model and task. Related programming
languages and broader language material may still contribute useful context.
Corpus breadth is a variable to test; the narrowest possible selection is not
automatically the most useful one. This qualification is explored in the
[discussion of specialized models](https://www.youtube.com/watch?v=XUMdjWNWFYg&t=525s).

# What the OpenWALDO experiments showed

Recent OpenWALDO experiments began with foundation models approaching a billion
parameters. The cost and duration of experimentation led to a smaller training
ladder: establish useful behavior at a tiny scale, define success criteria, and
then scale up.

The initial tiny models performed poorly. Changes to architecture, parameter
count, training duration, epochs, and data amount—including deliberate
undertraining and overtraining—did not produce the expected improvement.

Those models had been receiving smaller slices of essentially the same broad
corpus.

The reported improvement followed a narrower selection of language, topics, and
capabilities. The results included models under 10 million parameters that could
reasonably predict tokens, produce decent English, and maintain context within
their scope.
[Original experimental account](https://x.com/gmkurtzer/status/2107611828935360803)

That scope is part of the result. The useful observation is that a deliberately
narrower training task helped these particular small-model experiments. In the
interview, a [tiny-model experiment](https://www.youtube.com/watch?v=XUMdjWNWFYg&t=756s)
is described as an early, limited result, with words and phrases among the
reported outputs.

# Establish capability before scaling

A training ladder needs a purpose for each rung. The intended capability,
success criteria, and metrics should make it possible to decide whether an
experiment has achieved enough to justify the next step.

Progression should depend on meeting the current rung's acceptance criteria.
Increasing parameter count or extending a run does not establish that those
criteria have been met. The
[discussion of resetting the training ladder](https://www.youtube.com/watch?v=XUMdjWNWFYg&t=720s)
places that decision before the next increase in scale.

For tiny-model experiments, corpus breadth belongs among the training choices
being examined. A disappointing result is a reason to inspect the selection of
material alongside the architecture and training configuration.

Models at this scale can also make participation more practical. The original
experimental account describes models small enough to train on a Mac or a small
system such as a Spark, opening the process to more people learning how training
works.

# Make the experiment available

A broad community corpus provides the material from which focused experiments
can be assembled. Different models and capability targets can use different
selections from that shared foundation.

A useful public experiment includes its data choices, model configuration,
training method, evaluation criteria, results, and limitations. An open build
chain gives other builders a way to inspect how the inputs become a model,
repeat the process, and test different choices.

[WALDO Composes](https://github.com/openwaldo/waldo/tree/main/composes) provide a
way to describe and share that work. The value includes the unsuccessful
attempts: what was tried, which assumptions remained in place, and what changed
when those assumptions were reconsidered.

The [discussion of the knowledge barrier](https://www.youtube.com/watch?v=XUMdjWNWFYg&t=1623s)
connects this openness to learning. Building models requires practical knowledge
as well as compute. Public recipes and community participation help people
develop that knowledge through work they can inspect, question, and improve.

That is how an expensive lesson becomes useful open-source knowledge.
