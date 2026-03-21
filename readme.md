!["FAILS logo"](failslogo.svg)
# Fancy automated internet lecture system (**FAILS**) - components

This is main monorepo of FAILS components. (Created as consolidation of the multiple repos used before for FAILS)

A web-based system developed out of university lectures.
It is a continuous pen-based notepad editor delivering **electronic chalk** to several beamers in the lecture hall including also advanced audio/video transmissions capabilities.

The students can follow the lecture also on their tablets and notebooks and can scroll independently and ask questions to the lecturer using a chat function.
Furthermore, polls can be conducted.

After the lecture has been completed a pdf can be downloaded at any time.

FAILS components is completely integrated using LTI into LMS such as Moodle.

It is the reincarnation of a system, we were using at our theoretical physics institute for several years. FAILS components was rolled out university wide at TU Berlin, since a couple of years.

The system is written with containerization and scalability in mind.

Feedback on errors/issues is appreciated via github's functions.

Most parts of FAILS is licensed via GNU Affero GPL version 3.0.
Some packages have a more permissive license to enable their use outside of FAILS.

## Structure of the minorepo

* `daemons` includes the source code of the containers running various daemons handling FAILS' backend
* `packages` includes most of the packages FAILS using internally including reusuable components for whiteboarding and for audio and video transmission using Webcodecs and Webtransport.
* `deploy`includes examples directories for deploying the FAILS webapp via Docker compose or Kubernetes using a helm chart.

## Installation
For installation instructions for a containerized envoironment, please see the  `deploy` directory.