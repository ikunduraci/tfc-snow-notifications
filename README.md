# tfc-snow-notifications

This repository contains code for Terraform Cloud to send notifications to ServiceNow via Scripted Rest API.

There are 2 files in this repository

## ScriptedRestAPI-POST.js

This is the Script REST resource (of type `POST`). The resource needs to be public (untick `Requires authentication`).

## Base64ToHexConverter.js

This is Script Include script that takes care of converting Base64 to Hex.
