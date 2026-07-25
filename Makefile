# openwaldo.org — site maintenance
#
# `make stats` (or just `make`) recounts the corpus from a local
# waldo-index checkout and rewrites the JSON behind the front page's
# stats strip. Commit the result. Eventually this pulls from the
# repository in realtime; for now the checkout is assumed alongside
# this repo.
#
#   INDEX  path to the waldo-index checkout   (default: ../waldo-index)
#   STATS  where the site reads its numbers   (update at launch when
#          the site moves from kl24bg/ back to the repo root)

INDEX ?= ../waldo-index
STATS ?= kl24bg/assets/stats.json

.PHONY: stats
stats:
	python3 tools/corpus-stats.py $(INDEX) -o $(STATS)
