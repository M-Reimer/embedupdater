# -*- Mode: Makefile -*-
#
# Makefile for EmbedUpdater
#

.PHONY: xpi

xpi: clean
	zip -r9 embedupdater-trunk.xpi manifest.json \
                                 content

clean:
	rm -f embedupdater-trunk.xpi
