# -*- coding: utf-8 -*-
"""
Python Engine for Calculadora Python
Executes expressions, scripts, and math functions safely and returns structured JSON.
"""

import sys
import io
import ast
import json
import time
import math
import cmath
import decimal
from decimal import Decimal
import fractions
from fractions import Fraction
import statistics
import random
import itertools
import datetime

def get_math_env():
    """Create comprehensive math environment for the calculator."""
    env = {
        # Core modules
        'math': math,
        'cmath': cmath,
        'decimal': decimal,
        'fractions': fractions,
        'statistics': statistics,
        'random': random,
        'itertools': itertools,
        'datetime': datetime,
        'Decimal': Decimal,
        'Fraction': Fraction,
        
        # Constants
        'pi': math.pi,
        'e': math.e,
        'tau': math.tau if hasattr(math, 'tau') else 2 * math.pi,
        'inf': math.inf,
        'nan': math.nan,
        
        # Basic & Power / Root
        'sqrt': math.sqrt,
        'cbrt': getattr(math, 'cbrt', lambda x: x ** (1/3)),
        'pow': pow,
        'exp': math.exp,
        'log': math.log,
        'log10': math.log10,
        'log2': math.log2,
        'abs': abs,
        'round': round,
        'floor': math.floor,
        'ceil': math.ceil,
        'trunc': math.trunc,
        
        # Trigonometric (radians & conversion)
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'asin': math.asin,
        'acos': math.acos,
        'atan': math.atan,
        'atan2': math.atan2,
        'sinh': math.sinh,
        'cosh': math.cosh,
        'tanh': math.tanh,
        'asinh': math.asinh,
        'acosh': math.acosh,
        'atanh': math.atanh,
        'degrees': math.degrees,
        'radians': math.radians,
        
        # Combinatorics & Number Theory
        'factorial': math.factorial,
        'gcd': math.gcd,
        'lcm': getattr(math, 'lcm', lambda a, b: abs(a * b) // math.gcd(a, b)),
        'comb': getattr(math, 'comb', None),
        'perm': getattr(math, 'perm', None),
        
        # Statistics
        'mean': statistics.mean,
        'median': statistics.median,
        'mode': getattr(statistics, 'mode', None),
        'stdev': statistics.stdev,
        'variance': statistics.variance,
        
        # Python utilities
        'sum': sum,
        'min': min,
        'max': max,
        'len': len,
        'range': range,
        'list': list,
        'dict': dict,
        'set': set,
        'tuple': tuple,
        'bin': bin,
        'hex': hex,
        'oct': oct,
        'int': int,
        'float': float,
        'complex': complex,
        'str': str,
        'bool': bool
    }
    return env

def execute_code(source_code):
    start_time = time.perf_counter()
    env = get_math_env()
    
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    sys.stdout = captured_stdout
    sys.stderr = captured_stderr
    
    result_val = None
    result_type = None
    success = True
    error_msg = None
    
    try:
        tree = ast.parse(source_code)
        if len(tree.body) > 0 and isinstance(tree.body[-1], ast.Expr):
            last_expr = tree.body.pop()
            exec_code = compile(tree, '<calc>', 'exec')
            eval_code = compile(ast.Expression(last_expr.value), '<calc>', 'eval')
            exec(exec_code, env)
            result_val = eval(eval_code, env)
            if result_val is not None:
                result_type = type(result_val).__name__
        else:
            exec_code = compile(tree, '<calc>', 'exec')
            exec(exec_code, env)
    except SyntaxError as se:
        success = False
        error_msg = f"Erro de Sintaxe (linha {se.lineno}): {se.msg}"
    except ZeroDivisionError:
        success = False
        error_msg = "Erro Matemático: Divisão por zero"
    except ValueError as ve:
        success = False
        error_msg = f"Erro de Valor: {str(ve)}"
    except OverflowError:
        success = False
        error_msg = "Erro de Overflow: Número excede o limite computacional"
    except Exception as e:
        success = False
        error_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
    execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    # Extract user variables
    base_keys = set(get_math_env().keys())
    user_vars = {}
    for k, v in env.items():
        if not k.startswith('_') and k not in base_keys:
            try:
                # Provide string representation and type
                val_repr = repr(v)
                if len(val_repr) > 100:
                    val_repr = val_repr[:100] + '...'
                user_vars[k] = {
                    'value': val_repr,
                    'type': type(v).__name__
                }
            except Exception:
                pass

    formatted_result = None
    if result_val is not None:
        if isinstance(result_val, float):
            # Clean floating representation (avoid 0.30000000000000004 when 0.3)
            formatted_result = f"{result_val:.10g}"
        elif isinstance(result_val, complex):
            formatted_result = f"{result_val.real:.10g} + {result_val.imag:.10g}j" if result_val.imag >= 0 else f"{result_val.real:.10g} - {abs(result_val.imag):.10g}j"
        else:
            formatted_result = repr(result_val)
            
    return {
        'success': success,
        'result': formatted_result,
        'raw_result': str(result_val) if result_val is not None else None,
        'result_type': result_type,
        'stdout': captured_stdout.getvalue(),
        'stderr': captured_stderr.getvalue() or (error_msg if not success else ""),
        'error': error_msg,
        'variables': user_vars,
        'execution_time_ms': execution_time_ms
    }

def plot_function(func_str, x_min=-10.0, x_max=10.0, num_points=200):
    start_time = time.perf_counter()
    env = get_math_env()
    
    # Compile function expression
    try:
        expr_code = compile(ast.Expression(ast.parse(func_str, mode='eval').body), '<plot>', 'eval')
    except Exception as e:
        return {
            'success': False,
            'error': f"Erro ao compilar f(x): {str(e)}",
            'points': []
        }
        
    points = []
    roots = []
    step = (x_max - x_min) / max(1, (num_points - 1))
    
    min_y = float('inf')
    max_y = float('-inf')
    prev_y = None
    prev_x = None
    
    for i in range(num_points):
        x = x_min + i * step
        env['x'] = x
        try:
            y = eval(expr_code, env)
            if isinstance(y, (int, float)):
                if math.isnan(y) or math.isinf(y):
                    points.append({'x': round(x, 4), 'y': None})
                else:
                    points.append({'x': round(x, 4), 'y': round(y, 6)})
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                    
                    # Detect root (sign change or near 0)
                    if prev_y is not None and prev_x is not None:
                        if (prev_y * y < 0) or (abs(y) < 1e-7):
                            approx_root = x if abs(y) < 1e-7 else (prev_x + x) / 2
                            roots.append(round(approx_root, 4))
                    prev_y = y
                    prev_x = x
            else:
                points.append({'x': round(x, 4), 'y': None})
        except Exception:
            points.append({'x': round(x, 4), 'y': None})
            prev_y = None
            
    exec_time = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        'success': True,
        'func': func_str,
        'points': points,
        'roots': roots[:10],
        'min_y': round(min_y, 4) if min_y != float('inf') else None,
        'max_y': round(max_y, 4) if max_y != float('-inf') else None,
        'execution_time_ms': exec_time
    }

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({'error': 'No input received'}))
            return
            
        data = json.loads(raw_input)
        action = data.get('action', 'eval')
        
        if action == 'eval':
            code = data.get('code', '')
            output = execute_code(code)
            print(json.dumps(output))
        elif action == 'plot':
            func = data.get('func', 'x**2')
            x_min = float(data.get('xMin', -10))
            x_max = float(data.get('xMax', 10))
            points = int(data.get('points', 200))
            output = plot_function(func, x_min, x_max, points)
            print(json.dumps(output))
        else:
            print(json.dumps({'error': f'Ação desconhecida: {action}'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': f'Falha no motor: {str(e)}'}))

if __name__ == '__main__':
    main()
