"""Digital Elevation Model (DEM) terrain derivative processing engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Computes true physical slope, aspect, curvature, and Topographic Wetness Index (TWI)
using Horn (1981) and Zevenbergen & Thorne (1987) 3x3 finite-difference algorithms.
CRITICAL RULE: Never calculate fake slope values from arbitrary UI coordinates.
"""
import math
from typing import Dict, Any, List, Tuple


def calculate_slope_and_aspect_horn(
    grid_3x3: List[List[float]],
    cell_size_m: float = 30.0
) -> Dict[str, float]:
    """Calculate slope and aspect using Horn's 3x3 finite-difference algorithm.

    Grid layout:
      [ [z11, z12, z13],
        [z21, z22, z23],
        [z31, z32, z33] ]
    where row 0 is North, row 2 is South, col 0 is West, col 2 is East.
    """
    if len(grid_3x3) < 3 or any(len(row) < 3 for row in grid_3x3):
        raise ValueError("Horn terrain derivative requires at least a 3x3 elevation matrix")

    if cell_size_m <= 0:
        raise ValueError("DEM cell resolution must be strictly positive")

    z11, z12, z13 = grid_3x3[0][0], grid_3x3[0][1], grid_3x3[0][2]
    z21, z22, z23 = grid_3x3[1][0], grid_3x3[1][1], grid_3x3[1][2]
    z31, z32, z33 = grid_3x3[2][0], grid_3x3[2][1], grid_3x3[2][2]

    # Partial derivative dz/dx (East-West rate of change)
    dz_dx = ((z13 + 2.0 * z23 + z33) - (z11 + 2.0 * z21 + z31)) / (8.0 * cell_size_m)

    # Partial derivative dz/dy (North-South rate of change, North is row 0)
    dz_dy = ((z11 + 2.0 * z12 + z13) - (z31 + 2.0 * z32 + z33)) / (8.0 * cell_size_m)

    # Gradient magnitude
    gradient = math.sqrt(dz_dx ** 2 + dz_dy ** 2)

    # Slope angle in degrees
    slope_rad = math.atan(gradient)
    slope_deg = math.degrees(slope_rad)

    # Compass aspect (0 - 360 degrees from True North)
    if dz_dx == 0.0 and dz_dy == 0.0:
        aspect_deg = 0.0  # Flat plain
    else:
        aspect_rad = math.atan2(dz_dy, -dz_dx)
        aspect_math_deg = math.degrees(aspect_rad)
        if aspect_math_deg < 0:
            aspect_deg = 90.0 - aspect_math_deg
        elif aspect_math_deg > 90.0:
            aspect_deg = 360.0 - aspect_math_deg + 90.0
        else:
            aspect_deg = 90.0 - aspect_math_deg
        aspect_deg = aspect_deg % 360.0

    # Topographic Wetness Index (TWI) = ln(a / tan(beta))
    # Assume specific upslope contributing area a ~ 100m * cell_size
    tan_slope = max(math.tan(slope_rad), 0.005)
    twi = math.log(max(10.0, 100.0 * cell_size_m) / tan_slope)

    # Profile curvature (second derivative along line of steepest slope)
    d2z_dx2 = ((z13 - 2 * z12 + z11) + (z23 - 2 * z22 + z21) + (z33 - 2 * z32 + z31)) / (3.0 * cell_size_m ** 2)
    d2z_dy2 = ((z11 - 2 * z21 + z31) + (z12 - 2 * z22 + z32) + (z13 - 2 * z23 + z33)) / (3.0 * cell_size_m ** 2)
    d2z_dxdy = ((z13 - z11) - (z33 - z31)) / (4.0 * cell_size_m ** 2)

    p = dz_dx
    q = dz_dy
    p2_q2 = p ** 2 + q ** 2
    if p2_q2 > 1e-6:
        profile_curv = -(p ** 2 * d2z_dx2 + 2.0 * p * q * d2z_dxdy + q ** 2 * d2z_dy2) / (p2_q2 * (1.0 + p2_q2) ** 1.5)
        plan_curv = -(q ** 2 * d2z_dx2 - 2.0 * p * q * d2z_dxdy + p ** 2 * d2z_dy2) / (p2_q2 ** 1.5)
    else:
        profile_curv = 0.0
        plan_curv = 0.0

    return {
        "elevation_m": round(z22, 2),
        "slope_degrees": round(slope_deg, 2),
        "aspect_degrees": round(aspect_deg, 2),
        "twi": round(twi, 2),
        "profile_curvature": round(profile_curv, 4),
        "plan_curvature": round(plan_curv, 4),
        "dz_dx": round(dz_dx, 4),
        "dz_dy": round(dz_dy, 4),
    }
