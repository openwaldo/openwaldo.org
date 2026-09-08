---
title: From a compose to a trained model
type: blog
author: Gregory M. Kurtzer
description: What we have learned building OpenWALDO’s model compose ladder, and what anyone can use today to train, inspect, continue, and export an auditable model.
---

# From a compose to a trained model

Over the past several weeks, we have crossed an important OpenWALDO milestone:
we are no longer only assembling an open training corpus. We are using it to
train models from scratch, continue existing models, test them interactively,
and preserve the complete record of how each one was made.

We started with a model that could barely babble. We moved through coherent
text generation, basic conversation, and structured tool calls. Along the way,
we found bad corpus mixtures, weak prompt contracts, training plans that took
too long to evaluate, and distributed-training behavior that needed to be
corrected. Those failures have been as valuable as the successful runs because
they are now captured as improvements to the shared process.

That is exactly why OpenWALDO exists.

# The compose is the experiment

An OpenWALDO model compose is a small YAML or JSON document that declares the
model and how it should be trained. It includes:

- the model architecture and tokenizer;
- the interaction format the model should learn;
- an optional existing or external base model;
- ordered pretraining, midtraining, and fine-tuning stages;
- corpus selections, weights, languages, licenses, and content filters; and
- token or epoch budgets, learning rates, checkpoints, and evaluations.

The complete, annotated format is documented in the
[model compose guide](https://github.com/openwaldo/waldo/blob/main/docs/MODEL-COMPOSE.md).

The compose intentionally does not describe a particular GPU, filesystem, or
cloud. The same experiment can use MLX on an Apple system, PyTorch or TorchTitan
on a Linux GPU host, or TorchTitan across multiple hosts.

I have come to think of the compose as the smallest artifact of
reproducibility. It says what we intended to build. The resulting OpenWALDO
Bill of Materials proves what actually happened: the immutable corpus objects,
resolved filters, model lineage, run configuration, checkpoints, evaluations,
telemetry, and final artifacts.

That proof holds water because the software, compose, index, data references,
and history are open, auditable, available, and content-addressed.

# A capability ladder, not a hardware ladder

Our first compose experiments were named around machines and run times. That
was the wrong abstraction. A model should be defined by what it is intended to
accomplish, not by whichever GPU happened to be available when we wrote the
file.

The current [compose ladder](https://github.com/openwaldo/waldo/tree/main/composes)
now progresses by capability:

1. **Canary** is an approximately 14-million-parameter release gate. It is not
   expected to be useful. It cheaply verifies ingestion, training, evaluation,
   checkpointing, artifact persistence, and inference.
2. **Babble** is an approximately 76-million-parameter model trained from
   scratch on edited prose, reference material, science, and a small amount of
   conversation data. Its goal is coherent short-form language and simple
   interaction without repetition collapse.
3. **Conversation level 1** is an approximately 337-million-parameter model
   with broad foundation training followed by assistant-response training. It
   is the first rung expected to answer directly, retain prior turns, and ask
   for clarification.
4. **Conversation level 2** continues the same model with technical discourse
   and expanded multi-turn instruction data while preserving the earlier
   conversation behavior.
5. **Tool use** starts from a verified conversation checkpoint and adds a
   focused tool-use stage. It teaches one declared interaction contract rather
   than retraining the entire foundation.

These are reference experiments, not model-quality guarantees. They make each
new capability testable before we spend more compute on the next one.

# What the experiments taught us

The first lesson was that lower held-out loss does not automatically produce a
useful assistant. A raw causal model can write plausible prose while answering
a question poorly. Conversation behavior must be deliberately represented,
the model must see the same turn format during training and inference, and loss
must be applied to the assistant response rather than blindly supervising the
entire transcript.

The second lesson was that more data is not automatically better data. One
early technical model learned the style of wiki discussion pages so strongly
that ordinary answers looked like editor conversations. We added general
content assessments, main-content selection, language filtering, corpus
weights, and controls for repetitive and boilerplate material. These are
portable data properties, not special cases embedded for individual corpora.

The third lesson came from tool training. Our first long tool-use run could
emit something that looked like a tool call, but it called invented tools when
none were available and sometimes answered ordinary questions with bare call
arrays. The problem was not simply model size. We had mixed incompatible call
protocols and spent too much compute teaching conflicting behavior. The
revised compose begins with the conversational model, declares tool capability
at the model level, uses one interaction format, and performs a much smaller,
reviewed specialization stage.

We also learned to make expensive failures happen earlier. WALDO now checks
every corpus path before downloading shards, validates the training backend,
reports resource forecasts, selects deterministic held-out records, and
performs multi-host runtime, GPU, network, and RDMA checks before beginning a
run.

# What you can do today

Anyone can clone WALDO, pull the public index, and run the smallest complete
training path:

```console
git clone https://github.com/openwaldo/waldo.git
cd waldo
go build -o waldo ./cmd/waldo

./waldo index pull
./waldo model forecast composes/0000-canary.yaml
./waldo model train my-canary composes/0000-canary.yaml
./waldo model summary my-canary
./waldo model chat my-canary
```

The canary is the right first test because it verifies the complete local
pipeline in minutes. After that, `0001-babble.yaml` is the first useful
from-scratch experiment, and the conversation composes show how to build a
multi-stage assistant.

During training, WALDO writes spreadsheet-ready CSV telemetry containing
steps, loss, held-out loss, perplexity, learning rate, throughput, ETA, and
checkpoint events. `waldo model summary` reports architecture, parameter
count, training history, corpus allocation, evaluation results, and artifact
locations. A safely interrupted single-host compose can continue from its
durable transaction and checkpoint rather than beginning again.

Models can also begin from verified existing weights. A compose may name a
managed WALDO model or a commit-pinned Hugging Face model as its base. WALDO
records that lineage and verifies architecture compatibility before training.

Completed models can be tested with `waldo model chat` and exported as native
WALDO, Hugging Face, MLX, GGUF, or Ollama packages. The interaction contract,
including whether the model was trained for tools, travels with the model
instead of being guessed during export.

# Training across hosts

OpenWALDO also supports homogeneous multi-host training through TorchTitan,
PyTorch FSDP2, and NCCL. The operator provides a simple hostfile:

```text
train-0
train-1
```

Then launches the normal training command from the first host:

```console
./waldo model train my-model composes/0002-conversation1.yaml \
  --hostfile ./hosts
```

WALDO verifies the Python, PyTorch, TorchTitan, GPU, network-interface, RDMA,
and locked-memory configuration on every host. Rank zero resolves and
tokenizes the corpus, each GPU receives a distinct portion of every global
batch, and the model state is sharded across ranks. Secondary hosts do not need
the WALDO binary or corpus installed in advance; the launcher stages the exact
binary and streams compact training frames.

This path is deliberately non-elastic today. Every node must remain available,
and multi-host checkpoint restart is still pending. Start with the canary and
the documented
[host preflight](https://github.com/openwaldo/waldo/blob/main/docs/MULTI-NODE-TRAINING.md)
before committing a cluster to a long run.

# Where we go next

The next goal is not merely a larger number of parameters. It is a stronger,
measurable progression from foundation knowledge to conversation, tools,
reasoning, and reliable agent behavior.

That means improving corpus quality and coverage, publishing fixed behavioral
evaluations, comparing checkpoints instead of only final loss, validating
distributed scaling on real clusters, and preserving failures alongside the
runs that worked.

OpenWALDO can train an auditable model today. It can show you what went into
the model, what happened during the run, where the weights came from, and how
to repeat the experiment. The models are still small and the training system
is still evolving, but the complete open-source loop now exists.

Try the canary. Change a compose. Train something. Share the result—and the
lessons—with the [OpenWALDO community](https://openwaldo.org/join/).

Greg
