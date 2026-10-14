package com.jarvis.mahi

import com.jarvis.mahi.util.CalculatorEvaluator
import org.junit.Assert.assertEquals
import org.junit.Test

class CalculatorEvaluatorTest {

    @Test
    fun testMultiplication() {
        val result = CalculatorEvaluator.evaluate("25 * 4")
        assertEquals("100", result)
    }

    @Test
    fun testAddition() {
        val result = CalculatorEvaluator.evaluate("15 + 35")
        assertEquals("50", result)
    }

    @Test
    fun testDivision() {
        val result = CalculatorEvaluator.evaluate("100 / 5")
        assertEquals("20", result)
    }

    @Test
    fun testInvalidExpression() {
        val result = CalculatorEvaluator.evaluate("abc + xyz")
        assertEquals("Invalid expression", result)
    }
}
