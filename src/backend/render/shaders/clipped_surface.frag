// Taken from niri and modified, licensed GPL-3.0
// Optimized: replaced branching per-corner distance with SDF rounded_box

#version 100

//_DEFINES_

#if defined(EXTERNAL)
#extension GL_OES_EGL_image_external : require
#endif

precision highp float;
#if defined(EXTERNAL)
uniform samplerExternalOES tex;
#else
uniform sampler2D tex;
#endif

uniform float alpha;
varying vec2 v_coords;

#if defined(DEBUG_FLAGS)
uniform float tint;
#endif

uniform vec2 geo_size;
uniform vec4 corner_radius;
uniform mat3 input_to_geo;

// Signed distance function for a rounded box with per-corner radii.
// p: point relative to box center, b: box half-size, r: corner radii
//   r.x = top-left, r.y = top-right, r.z = bottom-right, r.w = bottom-left
// Adapted for y-down screen space (texture coordinates).
// Returns negative inside, positive outside.
float rounded_box(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.zy : r.wx;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

void main() {
    vec3 coords_geo = input_to_geo * vec3(v_coords, 1.0);

    // Sample the texture.
    vec4 color = texture2D(tex, v_coords);
    #if defined(NO_ALPHA)
    color = vec4(color.rgb, 1.0);
    #endif

    if (coords_geo.x < 0.0 || 1.0 < coords_geo.x || coords_geo.y < 0.0 || 1.0 < coords_geo.y) {
        // Clip outside geometry.
        color = vec4(0.0);
    } else {
        // Apply corner rounding via SDF — branchless per-corner selection.
        vec2 pixel_coords = coords_geo.xy * geo_size;
        vec2 center = geo_size * 0.5;
        float dist = rounded_box(pixel_coords - center, center, corner_radius);
        float clip_alpha = 1.0 - smoothstep(-0.5, 0.5, dist);
        color = color * clip_alpha;
    }

    // Apply final alpha and tint.
    color = color * alpha;

    #if defined(DEBUG_FLAGS)
    if (tint == 1.0)
        color = vec4(0.0, 0.2, 0.0, 0.2) + color * 0.8;
    #endif

    gl_FragColor = color;
}
