// hooks/useWebSocket.js
import { useCallback, useRef, useState, useEffect } from "react"

const useWebSocket = (telegram_id) => {
    const [isConnected, setIsConnected] = useState(false) // ✅ Используем state вместо ref
    const ws = useRef(null)
    const url = useRef(null)
    const reconnectTimeoutRef = useRef(null)

    useEffect(()=>{
        // Используем локальный IP или localhost
        url.current = `ws://192.168.1.48:8000/ws/${String(telegram_id)}`
        console.log(`🔗 WebSocket URL: ${url.current}`)
    }, [telegram_id])

    const clearReconnectTimeout = () => {
        if(reconnectTimeoutRef.current){
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }

    const handleOpen = useCallback((e)=>{
        console.log('✅ Соединение открыто')
        setIsConnected(true)
        clearReconnectTimeout()
    }, [])

    const handleClose = useCallback((e) => {
        console.warn(`🔌 Соединение закрыто: код ${e.code}, причина: ${e.reason}`)
        setIsConnected(false)
        
        // Автопереподключение через 2 секунды
        clearReconnectTimeout()
        reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Пытаюсь переподключиться...')
            connect()
        }, 2000)
    }, [])

    const handleError = useCallback((e) => {
        console.error('❌ Ошибка WebSocket:', e)
        setIsConnected(false)
    }, [])

    const handleMessage = useCallback((e) => {
        try {
            if (typeof e.data === 'string') {
                const messageData = JSON.parse(e.data)
                console.log('📥 Получено сообщение:', messageData)
            } else {
                console.log('📥 Получены бинарные данные:', e.data.byteLength, 'байт')
            }
        } catch (error) {
            console.warn('⚠️ Ошибка обработки сообщения:', error)
        }
    }, [])

    const sendMessage = useCallback((message)=>{
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.warn("❌ Ошибка отправки: соединение закрыто")
            return false
        }
        try {
            ws.current.send(message)
            return true
        } catch (err) {
            console.warn("❌ Ошибка отправки сообщения:", err)
            return false
        }
    }, [])

    const connect = useCallback(()=>{
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            console.log("ℹ️ Уже подключен или подключается")
            return
        }
        
        // Закрываем существующее соединение
        if(ws.current){
            ws.current.close()
            ws.current = null
        }
        
        try {
            console.log("🔄 Подключаемся...")
            ws.current = new WebSocket(url.current) 
            
            ws.current.binaryType = 'arraybuffer' // ✅ Устанавливаем тип бинарных данных
            
            ws.current.onopen = handleOpen
            ws.current.onmessage = handleMessage
            ws.current.onclose = handleClose
            ws.current.onerror = handleError
                 
        } catch (error) {
            console.error('❌ Ошибка подключения:', error)
            setIsConnected(false)
        }
    }, [])

    const disconnect = useCallback(() => {
        clearReconnectTimeout()
        if (ws.current) {
            console.log('🔌 Закрываю соединение...')
            ws.current.close(1000, "Закрыто клиентом")
            ws.current = null
        }
        setIsConnected(false)
    }, [])

    return {
        isConnected,
        connect,
        disconnect,
        sendMessage
    }
}

export default useWebSocket