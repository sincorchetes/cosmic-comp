precision highp float;
uniform float alpha;
#if defined(DEBUG_FLAGS)
uniform float tint;
#endif
uniform vec2 size;
varying vec2 v_coords;

uniform vec3 color;
uniform float thickness;
uniform vec4 radius;
uniform float scale;

// Branchless SDF for a rounded box with per-corner radii.
// p: point relative to box center, b: box half-size, r: corner radii
//   r.x = top-left, r.y = top-right, r.z = bottom-right, r.w = bottom-left
// Adapted for y-down screen space.
float rounded_box(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.zy : r.wx;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

void main() {
    vec2 location = v_coords * size;
    vec2 center = size * 0.5;
    float half_px = 0.5 / scale;

    // Outer rounded rect
    float outer_dist = rounded_box(location - center, center, radius);
    float outer_alpha = 1.0 - smoothstep(-half_px, half_px, outer_dist);

    // Inner rounded rect (hollow out the border)
    float inner_alpha = 1.0;
    if (thickness > 0.0) {
        vec2 inner_size = size - vec2(thickness * 2.0);
        vec2 inner_center = inner_size * 0.5;
        vec2 inner_loc = location - vec2(thickness);
        vec4 inner_radius = max(radius - vec4(thickness), vec4(0.0));
        float inner_dist = rounded_box(inner_loc - inner_center, inner_center, inner_radius);
        inner_alpha = smoothstep(-half_px, half_px, inner_dist);
    }

    vec4 mix_color = mix(vec4(0.0, 0.0, 0.0, 0.0), vec4(color, alpha), outer_alpha * inner_alpha);

    #if defined(DEBUG_FLAGS)
    if (tint == 1.0)
        mix_color = vec4(0.0, 0.3, 0.0, 0.2) + mix_color * 0.8;
    #endif

    gl_FragColor = mix_color;
}
