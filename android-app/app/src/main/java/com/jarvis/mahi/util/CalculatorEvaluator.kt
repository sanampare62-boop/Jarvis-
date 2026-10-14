package com.jarvis.mahi.util

object CalculatorEvaluator {

    fun evaluate(expression: String): String {
        val trimmed = expression.trim()
        if (trimmed.isEmpty()) return "0"

        return try {
            val result = parseAndEvaluate(trimmed)
            if (result == result.toLong().toDouble()) {
                result.toLong().toString()
            } else {
                result.toString()
            }
        } catch (e: Exception) {
            "Invalid expression"
        }
    }

    private fun parseAndEvaluate(expr: String): Double {
        var cleanExpr = expr.replace(" ", "")
        if (cleanExpr.isEmpty()) return 0.0

        // Handle simple binary operations (e.g., 25 * 4, 10 + 5, 100 / 2)
        val operators = listOf('+', '-', '*', '/', '%')
        var opIndex = -1
        var opChar = ' '

        // Find operator outside parens if any
        for (i in cleanExpr.indices.reversed()) {
            val c = cleanExpr[i]
            if (c in operators && i > 0) {
                opIndex = i
                opChar = c
                break
            }
        }

        if (opIndex != -1) {
            val left = cleanExpr.substring(0, opIndex).toDouble()
            val right = cleanExpr.substring(opIndex + 1).toDouble()
            return when (opChar) {
                '+' -> left + right
                '-' -> left - right
                '*' -> left * right
                '/' -> if (right != 0.0) left / right else throw ArithmeticException("Division by zero")
                '%' -> left % right
                else -> 0.0
            }
        }

        return cleanExpr.toDouble()
    }
}
