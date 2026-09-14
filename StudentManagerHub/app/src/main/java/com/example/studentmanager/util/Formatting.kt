package com.example.studentmanager.util

import kotlin.math.pow
import kotlin.math.round

/**
 * Formats a 0..100 percentage for display. Returns an em dash when the value
 * is unknown so the UI never shows a misleading "0%".
 */
fun formatPercentage(value: Double?, decimals: Int = 1): String {
    if (value == null || value.isNaN() || value.isInfinite()) return "—"
    val factor = 10.0.pow(decimals)
    val rounded = round(value * factor) / factor
    return "$rounded%"
}

fun formatCount(value: Int): String = value.toString()
