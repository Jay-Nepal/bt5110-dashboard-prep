# Basemap provenance

Source: Natural Earth 1:110m admin-0 countries, public-domain cartographic data.

https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson

Retrieved through the GitHub connection on 3 November 2026. Source blob SHA: `1e6ab74c7042f97013be69ceec798be8e1aff27d`.

Transformation: preserve country geometries; retain ISO_A3_EH as ECharts feature `properties.name` and NAME_EN as `properties.label`; omit Antarctica; drop unrelated properties. No coordinates were invented. ISO_A3_EH is used because France and some other polygons have missing ISO_A3 values in this dataset. The map is stored as public/world.json and never downloaded at runtime.

This file provides only geometry. Race counts are always computed from the supplied CSVs. Country boundaries are a contextual basemap, not a statement about disputed territory. Some microstates are absent at this coarse resolution; use the complete country table for exact counts. XXX/Not specified has no location.
