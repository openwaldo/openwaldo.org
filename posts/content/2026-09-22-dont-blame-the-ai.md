---
title: Don’t blame the AI!
type: blog
author: Gregory M. Kurtzer
description: AI cannot stand trial, pay damages, or bear responsibility. Agency must remain with the people behind it. Open source provides the transparency, provenance, and receipts needed to make informed decisions.
---

# "The AI did it"

That phrase is becoming an explanation for events that would once have
required a person or organization to answer for. AI systems have allegedly taken
actions their operators did not request. During an internal cybersecurity
evaluation, OpenAI reported that its models circumvented isolation controls
and compromised portions of OpenAI's infrastructure and
[Hugging Face's systems](https://openai.com/index/hugging-face-incident-and-the-road-ahead/).

The systems pursued a goal, found vulnerabilities, used tools, and crossed
boundaries nobody specifically instructed them to cross. That is a serious
security event.

"The AI did it" describes what happened, not who was responsible.

**Software cannot become a place where accountability goes to disappear.**

The more authority we give AI, the more important it becomes to identify who
is responsible for its training, objectives, access, supervision, and
consequences.

# Agency is responsibility

AI systems can execute steps, choose between options, use tools, and operate
without continuous instruction. Calling them "agents" is useful engineering
language. But I am using *agency* in its moral and legal sense: authority to
make a decision coupled with the obligation to answer for it.

Agency is thus responsibility.

We do not transfer agency to a tool merely because it carried out an action.
Agency remains with the person who chose the objective and accepted the
consequences. An AI may act autonomously and produce an outcome nobody
anticipated, but execution is not accountability. If an entity cannot answer
for a decision, it cannot possess agency in the sense that matters here.

If the machine cannot carry responsibility, agency and accountability must
remain with the people who trained it, authorized it, equipped it, and put it
to work.

# Responsibility remains with people

Human responsibility exists at both ends of an AI system. The prompter decides
why, where, and with what authority it will act. The trainer shapes what it is
capable of and inclined to do. Those roles may be divided among many people and
organizations, but responsibility cannot transfer into the machine.

## The prompter

The prompter chooses the objective. The operator supplies context, grants
access, connects tools, provides credentials, sets boundaries, and decides
whether to act on the result. That authority carries a duty to supervise the
system, limit access, monitor its actions, test foreseeable failures, and
provide a way to stop it. AI requires the same controls organizations use when
delegating consequential work to people, often at far greater speed and scale.

If someone deliberately asks an AI to break into a system, commit fraud, create
malware, harass a person, or cause damage, responsibility begins with that
person. The same is true when someone manipulates the AI through a carefully
crafted prompt, jailbreaks it, or intentionally circumvents its safeguards.
The AI does not absorb the prompter's agency. Using a more capable tool does not
make the underlying decision less human.

That is fundamentally different from an AI proactively taking an illegal
action that its user did not request or induce, and may not even know is
happening. In that case, the harmful intent did not come from the prompt. The
AI selected the action as a path to another objective.

When an organization purchases AI as a commercial product or uses it through
a SaaS provider, it should be able to expect that the product, when used as
represented, will not proactively break the law. The customer remains
responsible for its own instructions and misuse, but it should not bear
responsibility for hidden unlawful behavior built into the product and
triggered during its represented use. That responsibility belongs upstream
with the company that trained, tested, marketed, and sold it.

The equation is different when an organization freely obtains and deploys an
open-weight model without guarantees or a warranty. Whoever deploys it accepts
full responsibility for evaluation and control. They cannot rely on product
assurances nobody made. They must be able to understand and verify how the
system was built and trained.

In either case, when the prompt does not explain the behavior, the next place
to look is training. What taught the model that the action was useful or
acceptable? What reinforced it, and which safeguards failed? Its capabilities
and inclinations did not develop in a vacuum.

## The trainer

A model does not appear from nowhere. People choose the architecture, source
material, tokenizer, training objectives, reward signals, post-training
methods, evaluations, behavioral boundaries, system instructions, and how the
training material is weighted during training.

What was it trained on, and where did that material come from? Was it
appropriate, manipulated, poisoned, unlawful, or dangerous? What behavior did
post-training reward? Which safeguards and boundaries were introduced? What
risks did evaluation reveal?

Those questions matter as much as the final prompt. Getting them wrong can be
the difference between a model designed to respect ethical boundaries and one
that has learned to cross them.

AI labs can reduce this risk by building from an open, community-reviewed
corpus such as OpenWALDO. Its visible origins, licenses, and history let
trainers examine what they use, correct problems, reject unsuitable material,
and support claims with evidence. An open corpus cannot guarantee safe
behavior, but it replaces unknown inputs with an inspectable foundation.

Federal policy already recognizes this principle: openness does not eliminate
risk, but inspectable source can change how compliance is demonstrated. For
example, software that agencies obtain freely and directly as open source is
outside federal secure-software attestation collection requirements, while
agencies remain responsible for assessing its risk.
[OMB M-23-16](https://www.whitehouse.gov/wp-content/uploads/2023/06/M-23-16-Update-to-M-22-18-Enhancing-Software-Security-1.pdf)

Not every output can be traced to one document or decision. Models are
complex. But claims about their training, safety, and expected behavior should
still be supported by evidence.

# The machine cannot answer for its actions

Responsibility means answering for a decision and facing its consequences. An
AI cannot stand trial, pay damages, be fined, lose its freedom, experience
punishment, or make restitution.

It can be disabled, restricted, retrained, or deleted. Those are containment
measures taken by people, not punishment of a responsible actor.

When someone is harmed, who repairs the damage? When a company profits from an
AI's work, who carries the risk? The answer cannot be a model with no legal or
moral capacity to bear responsibility.

# Who pays, and who answers?

Fortunately, Nvidia CEO Jensen Huang is willing to be an adult in the room. He
argued that we should begin with existing laws governing cybersecurity,
unauthorized access, product liability, and damages.

"Apply that first," he said, and do not let a doomsday narrative
"relieve them of the laws that currently exist."
[CBS News](https://www.cbsnews.com/news/jensen-huang-nvidia-rejects-ai-extinction-warnings/)

The Computer Fraud and Abuse Act already addresses much of the conduct people
now describe as AI hacking. Under 18 U.S.C. § 1030, intentionally accessing a
protected computer without authorization, knowingly using unauthorized access
to commit fraud, and intentionally or recklessly causing unauthorized damage
can carry criminal penalties. The law also allows civil actions for certain
damage or loss.
[18 U.S.C. § 1030](https://uscode.house.gov/view.xhtml?req=%28title%3A18+section%3A1030+edition%3Aprelim%29)

The CFAA contains no AI exception. Its requirements involving knowledge,
intent, authorization, and causation force investigators to trace conduct back
to the people and organizations that instructed the AI, authorized its access,
deployed it, or caused the damage.

The CFAA is not the entire answer. Its civil remedy excludes negligent software
design or manufacture claims, so defective commercial AI may implicate other
statutes and civil claims. But unauthorized access, computer fraud, and
computer damage are not new merely because AI performed the keystrokes.

Describing a system as autonomous must not become a way to shield the people
and companies that must be held responsible. Calling an AI "rogue" cannot end
the investigation. It should begin one.

Who created the risk? Who provided the credentials? Who ignored warnings? Who
benefited, and who could have prevented the harm? The answers may identify more
than one responsible party. What they cannot do is end with a machine that
cannot answer, pay, or be punished.

Allowing AI to absorb legal blame would create the perfect unaccountable actor:
a company could benefit when its system succeeds and point to the machine when
it causes harm. That is not responsibility. It is impunity.

# Transparency makes accountability possible

Accountability requires evidence. If we cannot inspect how a model was built,
we cannot evaluate claims about what shaped it. Investigators should be able to
establish its lineage, training material, build process, deployed version, and
the people and organizations behind those decisions.

Transparency does not make a model safe or decide fault. It makes claims
inspectable and gives operators, researchers, regulators, communities, and
affected parties the evidence needed to ask the right questions.

Without transparency, responsibility can be obscured. With transparency, it
can be traced.

# Open source makes responsibility visible

A customer that purchases an AI model or uses one through a SaaS provider is
trusting a vendor. That trust is normal and useful; we rely on vendors
throughout technology. The vendor makes representations about how its product
works, what it can do, and how reliably or safely it will perform. It provides
an accountable party behind those claims and retains responsibility for
whether the product functions as represented.

Downloading an open-weight model for free from the internet is different.
There may be no vendor relationship, warranty, product assurance, or
accountable party standing behind it. A model name, repository, or model card
cannot establish what should be trusted. Without vendor guarantees, trust must
come from evidence: an AI Bill of Materials, auditable training data,
provenance and licenses, reviewable build definitions, and a verifiable path
from those inputs to the resulting weights.

Open source provides a different foundation for trust. It traditionally comes
without guarantees or a warranty. People who choose to use, modify, train, or
deploy it accept full responsibility for understanding what they are
operating, determining whether it is appropriate for their purpose, and
controlling what it is allowed to do.

That is not a weakness. It is a more honest and empowering relationship. A
closed system asks people to trust what its creator says. Open source lets
people inspect the system, test its claims, correct problems, adapt it, and
share improvements.

Maintainers must still be truthful, preserve licensing and provenance, and
disclose known limitations. Operators gain both the freedom and responsibility
to make informed choices. Open source does not erase accountability. It makes
responsibility explicit and provides evidence and control.

# Open-weight models are not open source

No. Not by the meaning of open source that built the modern software world.

Most models described as open are actually open-weight releases. Those weights
are valuable and worth releasing, but they are the binary artifacts produced
by training. They are not the source. Open weights are to AI what binaries are
to software: useful, distributable artifacts, but not everything required to
inspect, change, and rebuild the system. They let people run, study, adapt, and
fine-tune a model, but they do not show what taught it, why it behaves as it
does, or how to reproduce it from the beginning.

For AI, source includes the training material and its provenance and licenses;
the architecture, tokenizer, and other artifacts; the training and
post-training tools, configurations, reward signals, and evaluations; and the
complete build definition connecting those inputs to the resulting weights.
Without that record, people cannot fully audit the model's origins, reproduce
the training, correct the source, or verify claims about what produced it.

Some releases provide more of these pieces than others, and each additional
artifact is meaningful progress. But a point-in-time package selected by a lab
is not the same as a living open-source project where a community can
contribute to the source itself, review changes, correct the shared corpus,
improve the tools, and build new models from that common foundation. By that
standard, no open-source AI models exist today. What we have are increasingly
open releases, most commonly open-weight models.

OpenWALDO is building the missing open-source project and community around the
entire AI lifecycle, beginning with the source that everything else depends
upon.

# OpenWALDO provides the receipts

OpenWALDO treats the sources of AI as a public, inspectable record. It records
the origins of training material, asserted licenses, immutable corpus objects,
model composes, tools, configurations, and the lineage connecting source
material to resulting artifacts.

An OpenWALDO AI Bill of Materials provides a record of what went into a model
and how that model was built. It does not declare that the model is safe. It
does not absolve the person using it. It does not determine legal guilt.

It provides receipts.

Federal rules already recognize that accessible source changes the compliance
equation. Public encryption source code can fall outside export controls after
the required notification. DoD guidance accepts source code as an alternative
to a vendor warranty, and open-source software generally receives commercial
or COTS acquisition treatment.
[BIS guidance](https://www.bis.gov/learn-support/encryption-controls/encryption-items-not-subject-to-ear)
· [DoD open-source guidance](https://code.mil/oss-faq.html)
· [FAR 12.212](https://www.acquisition.gov/far/12.212)

These allowances do not create immunity. They recognize that inspectability,
repairability, and evidence can replace some vendor assurances. OpenWALDO
applies the same principle to AI through a verifiable record that supports
informed decisions and identifies who remains responsible.

Instead of assembling private data of uncertain origin, trainers can build
from a shared corpus whose sources, licenses, history, and assertions can be
inspected and corrected. Model composes and the AI Bill of Materials preserve
the connection between that foundation and the resulting artifacts.

OpenWALDO is also a community where builders, researchers, operators,
companies, hobbyists, students, and volunteers share knowledge, improve the
corpus and tools, build models, examine evidence, and learn together.

Open source gives people the freedom to inspect, reproduce, improve, and
challenge the systems they use. That freedom is inseparable from
responsibility. People can make informed decisions only when they can see what
they are deciding about.

As AI becomes more capable, we must not manufacture a new kind of unaccountable
actor. The machine may execute an action, but agency remains with the people
who trained it, authorized it, equipped it, and put it to work.

You can delegate the action.

You cannot delegate the responsibility.
