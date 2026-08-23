import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models" / "launch3001-rocket.glb"
SEGMENTS = 48


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def material(name, color, metallic=0.0, roughness=0.35, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def add_ring_mesh(name, rings, mat, segments=SEGMENTS, cap_bottom=True, cap_top=True):
    verts = []
    for y, radius in rings:
        for i in range(segments):
            angle = i * math.tau / segments
            verts.append((math.cos(angle) * radius, y, math.sin(angle) * radius))

    faces = []
    for ring in range(len(rings) - 1):
        row = ring * segments
        nxt = (ring + 1) * segments
        for i in range(segments):
            faces.append((row + i, row + (i + 1) % segments, nxt + (i + 1) % segments, nxt + i))

    if cap_bottom and rings[0][1] > 0:
        center = len(verts)
        verts.append((0, rings[0][0], 0))
        faces.extend((center, i, (i + 1) % segments) for i in range(segments))

    if cap_top and rings[-1][1] > 0:
        center = len(verts)
        row = (len(rings) - 1) * segments
        verts.append((0, rings[-1][0], 0))
        faces.extend((center, row + (i + 1) % segments, row + i) for i in range(segments))

    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


def add_box_mesh(name, center, size, mat, rotation_y=0.0):
    sx, sy, sz = (value / 2 for value in size)
    points = [
        (-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
        (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz),
    ]
    cy = math.cos(rotation_y)
    sy_sin = math.sin(rotation_y)
    verts = []
    for x, y, z in points:
        rx = x * cy + z * sy_sin
        rz = -x * sy_sin + z * cy
        verts.append((center[0] + rx, center[1] + y, center[2] + rz))
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


def add_fin(name, angle, body_mat, orange_mat):
    cy = math.cos(angle)
    sy = math.sin(angle)
    root = 0.3
    outer = 0.58
    y_top = -0.22
    y_bottom = -0.82
    thickness = 0.055
    local = [
        (-thickness, y_bottom, root), (thickness, y_bottom, root), (thickness, y_top, root), (-thickness, y_top, root),
        (-thickness, y_bottom, outer), (thickness, y_bottom, outer), (thickness, -0.48, outer), (-thickness, -0.48, outer),
    ]
    verts = []
    for x, y, z in local:
        verts.append((x * cy + z * sy, y, -x * sy + z * cy))
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(body_mat)
    bpy.context.collection.objects.link(obj)

    add_box_mesh(name + "OrangeTip", (math.sin(angle) * 0.6, -0.58, math.cos(angle) * 0.6), (0.11, 0.28, 0.08), orange_mat, rotation_y=angle)


def add_front_triangle(name, y, z, size, mat):
    verts = [(0, y + size, z), (-size * 0.86, y - size * 0.55, z), (size * 0.86, y - size * 0.55, z)]
    faces = [(0, 1, 2)]
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


def build():
    clear_scene()

    white = material("warm white ceramic", (0.92, 0.94, 0.96, 1), metallic=0.25, roughness=0.22)
    panel = material("brushed panel grey", (0.58, 0.63, 0.68, 1), metallic=0.45, roughness=0.28)
    orange = material("launch orange", (0.98, 0.32, 0.04, 1), metallic=0.08, roughness=0.24, emission=(0.9, 0.18, 0.02, 1), strength=0.12)
    black = material("black glass", (0.005, 0.009, 0.014, 1), metallic=0.15, roughness=0.08, emission=(0.0, 0.08, 0.12, 1), strength=0.3)
    blue = material("badge blue", (0.02, 0.45, 0.75, 1), roughness=0.2, emission=(0.0, 0.25, 0.45, 1), strength=0.08)

    add_ring_mesh("short rounded fuselage", [(-0.78, 0.34), (-0.6, 0.39), (0.48, 0.35), (0.68, 0.28)], white)
    add_ring_mesh("orange nose cone", [(0.68, 0.28), (0.88, 0.22), (1.06, 0.08), (1.14, 0.0)], orange, cap_top=False)
    add_ring_mesh("engine skirt", [(-0.98, 0.43), (-0.78, 0.34)], panel, cap_bottom=False, cap_top=False)
    add_ring_mesh("central engine bell", [(-1.16, 0.19), (-1.0, 0.29), (-0.9, 0.2)], black, cap_top=False)

    for radius, y, name in [(0.355, 0.42, "upper seam"), (0.39, -0.2, "mid seam"), (0.42, -0.72, "lower seam")]:
        add_ring_mesh(name, [(y - 0.012, radius), (y + 0.012, radius)], panel, segments=SEGMENTS, cap_bottom=False, cap_top=False)

    for angle in (math.radians(35), math.radians(145), math.radians(215), math.radians(325)):
        add_fin("swept stabilizer", angle, white, orange)

    for angle in (math.radians(45), math.radians(135), math.radians(225), math.radians(315)):
        x = math.sin(angle) * 0.46
        z = math.cos(angle) * 0.46
        add_box_mesh("recessed landing pad", (x, -0.92, z), (0.2, 0.08, 0.24), black, rotation_y=angle)

    add_ring_mesh("porthole rim", [(0.32, 0.155), (0.36, 0.155)], panel, segments=SEGMENTS, cap_bottom=False, cap_top=False).rotation_euler[0] = math.radians(90)
    rim = bpy.data.objects["porthole rim"]
    rim.location = (0, 0.43, -0.345)
    porthole = add_ring_mesh("black porthole", [(0.0, 0.125), (0.012, 0.125)], black, segments=SEGMENTS, cap_bottom=True, cap_top=True)
    porthole.rotation_euler[0] = math.radians(90)
    porthole.location = (0, 0.43, -0.36)

    add_box_mesh("front orange stripe", (0, -0.28, -0.352), (0.045, 0.58, 0.012), orange)
    add_front_triangle("orange L3001 badge", -0.06, -0.356, 0.115, orange)
    add_front_triangle("blue L3001 inset", -0.065, -0.358, 0.065, blue)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(OUT), export_format="GLB", use_selection=True)


if __name__ == "__main__":
    build()
