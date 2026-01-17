import json
import os
import hashlib

def handler(event: dict, context) -> dict:
    '''API для пополнения баланса через T-Bank (Тинькофф)'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    terminal_key = os.environ.get('TBANK_TERMINAL_KEY', '')
    password = os.environ.get('TBANK_PASSWORD', '')
    
    if not terminal_key or not password:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'T-Bank credentials not configured'
            }),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            amount = body.get('amount')
            user_id = event.get('headers', {}).get('X-User-Id', 'anonymous')
            
            if not amount or amount < 10:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Minimum amount is 10 RUB'
                    }),
                    'isBase64Encoded': False
                }
            
            amount_kopecks = int(amount * 100)
            order_id = f"fedlaxes_{user_id}_{context.request_id}"
            
            token_data = {
                'Amount': amount_kopecks,
                'OrderId': order_id,
                'Password': password,
                'TerminalKey': terminal_key
            }
            
            token_string = ''.join(str(token_data[k]) for k in sorted(token_data.keys()))
            token = hashlib.sha256(token_string.encode()).hexdigest()
            
            payment_data = {
                'TerminalKey': terminal_key,
                'Amount': amount_kopecks,
                'OrderId': order_id,
                'Description': f'Пополнение баланса Fedlaxes',
                'Token': token,
                'SuccessURL': 'https://your-domain.com/?payment=success',
                'FailURL': 'https://your-domain.com/?payment=fail'
            }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'paymentUrl': f'https://securepay.tinkoff.ru/rest/Init',
                    'orderId': order_id,
                    'amount': amount,
                    'paymentData': payment_data
                }),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': str(e)
                }),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
