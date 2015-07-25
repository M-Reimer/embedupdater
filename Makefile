# -*- Mode: Makefile -*-
#
# Makefile for EmbedUpdater
#

.PHONY: xpi

xpi: clean
	zip -r9 embedupdater-trunk.xpi install.rdf \
                                 bootstrap.js \
                                 chrome.manifest \
                                 content

clean:
	rm -f embedupdater-trunk.xpi
