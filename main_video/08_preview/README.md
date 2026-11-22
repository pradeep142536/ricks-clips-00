# World inspection gate

The file `world_inspection_plan.json` defines the five proof cameras for the new connected world. Render these views first on Colab T4 and inspect them before building the final shot list.

Required outputs:

- `world_inspection_contact_sheet.png`
- `world_scale_test.png`
- `world_ground_contact_report.json`

This gate is passed only when the farmhouse, wheat field, staging area, hill, watering point, roads, dam, windmill, trees, emu flock, and fence all read as parts of the same world.
