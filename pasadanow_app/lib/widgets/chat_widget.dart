import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:stomp_dart_client/stomp.dart';
import 'package:stomp_dart_client/stomp_config.dart';
import 'package:stomp_dart_client/stomp_frame.dart';
import '../core/constants.dart';

class ChatWidget extends StatefulWidget {
  final String rideId;
  final String username;
  final String role; // 'commuter' or 'driver'

  const ChatWidget({
    super.key,
    required this.rideId,
    required this.username,
    required this.role,
  });

  @override
  State<ChatWidget> createState() => _ChatWidgetState();
}

class _ChatWidgetState extends State<ChatWidget> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  StompClient? _client;
  bool _connected = false;

  static const _bg = Color(0xFF0B1B35);
  static const _card = Color(0xFF102245);
  static const _accent = Color(0xFF3D7FD4);
  static const _orange = Color(0xFFE8863A);
  static const _green = Color(0xFF22C55E);
  static const _textPri = Color(0xFFE8EEF7);
  static const _textMut = Color(0xFF8A9BC0);
  static const _border = Color(0xFF1E3A6E);

  // ── Spring Boot base comes from constants, e.g. http://10.0.2.2:8080 ──
  String get _httpBase => ApiConstants.springBase;

  // ── WebSocket URL: swap http→ws, append SockJS path ───────────────────
  String get _wsUrl =>
      _httpBase.replaceFirst(RegExp(r'^http'), 'ws') + '/ws/chat/websocket';

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _connectWebSocket();
  }

  @override
  void dispose() {
    _client?.deactivate();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  // ── Load chat history from Spring Boot REST endpoint ───────────────────
  Future<void> _loadHistory() async {
    try {
      final uri = Uri.parse('$_httpBase/api/chat/${widget.rideId}');
      final res = await http.get(uri);
      if (res.statusCode == 200 && mounted) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() {
          _messages.clear();
          _messages.addAll(data.cast<Map<String, dynamic>>());
        });
        _scrollToBottom();
      }
    } catch (_) {
      // silently ignore — WebSocket will deliver new messages anyway
    }
  }

  // ── Connect STOMP over SockJS ──────────────────────────────────────────
  void _connectWebSocket() {
    _client = StompClient(
      config: StompConfig(
        url: _wsUrl,
        onConnect: _onConnected,
        onDisconnect: (_) {
          if (mounted) setState(() => _connected = false);
        },
        onStompError: (_) {
          if (mounted) setState(() => _connected = false);
        },
        onWebSocketError: (_) {
          if (mounted) setState(() => _connected = false);
        },
        // Reconnect automatically every 5 seconds if dropped
        reconnectDelay: const Duration(seconds: 5),
      ),
    );
    _client!.activate();
  }

  void _onConnected(StompFrame frame) {
    if (mounted) setState(() => _connected = true);

    _client!.subscribe(
      destination: '/topic/chat/${widget.rideId}',
      callback: (frame) {
        if (frame.body == null || !mounted) return;
        final msg = jsonDecode(frame.body!) as Map<String, dynamic>;
        setState(() => _messages.add(msg));
        _scrollToBottom();
      },
    );
  }

  void _sendMessage() {
    final text = _input.text.trim();
    if (text.isEmpty || _client == null || !_connected) return;

    _client!.send(
      destination: '/app/chat/${widget.rideId}',
      body: jsonEncode({
        'sender': widget.username,
        'role': widget.role,
        'content': text,
      }),
    );
    _input.clear();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ── UI ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(children: [
        _buildHeader(),
        Expanded(child: _buildMessageList()),
        _buildInputBar(),
      ]),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        border: Border(bottom: BorderSide(color: _border)),
      ),
      child: Row(children: [
        const Text('💬', style: TextStyle(fontSize: 15)),
        const SizedBox(width: 8),
        const Text('Ride Chat',
            style: TextStyle(
                color: _textPri, fontSize: 13, fontWeight: FontWeight.w700)),
        const Spacer(),
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _connected ? _green : _orange,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          _connected ? 'Live' : 'Connecting…',
          style: TextStyle(color: _connected ? _green : _orange, fontSize: 10),
        ),
      ]),
    );
  }

  Widget _buildMessageList() {
    if (_messages.isEmpty) {
      return const Center(
        child: Text('No messages yet',
            style: TextStyle(color: _textMut, fontSize: 12)),
      );
    }
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.all(10),
      itemCount: _messages.length,
      itemBuilder: (_, i) => _buildBubble(_messages[i]),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
        border: Border(top: BorderSide(color: _border)),
      ),
      child: Row(children: [
        Expanded(
          child: TextField(
            controller: _input,
            style: const TextStyle(color: _textPri, fontSize: 13),
            onSubmitted: (_) => _sendMessage(),
            decoration: InputDecoration(
              hintText: 'Type a message…',
              hintStyle: const TextStyle(color: _textMut, fontSize: 12),
              filled: true,
              fillColor: const Color(0xFF0D1E3D),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              isDense: true,
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: _sendMessage,
          child: Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: _connected ? _accent : _border,
              borderRadius: BorderRadius.circular(10),
            ),
            child:
                const Icon(Icons.send_rounded, color: Colors.white, size: 16),
          ),
        ),
      ]),
    );
  }

  Widget _buildBubble(Map<String, dynamic> msg) {
    final isMe = msg['sender'] == widget.username;
    final isDriver = msg['role'] == 'driver';
    final sender = msg['sender']?.toString() ?? '';
    final content = msg['content']?.toString() ?? '';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 7),
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
        constraints: const BoxConstraints(maxWidth: 240),
        decoration: BoxDecoration(
          color: isMe
              ? _accent
              : isDriver
                  ? const Color(0xFF1E3A2E)
                  : _card,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: Radius.circular(isMe ? 12 : 2),
            bottomRight: Radius.circular(isMe ? 2 : 12),
          ),
          border: isMe ? null : Border.all(color: _border),
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isMe) ...[
              Text(
                '${isDriver ? '🛺' : '👤'} $sender',
                style: TextStyle(
                    color: isDriver ? _orange : _textMut,
                    fontSize: 9,
                    fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 3),
            ],
            Text(content,
                style: const TextStyle(color: _textPri, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
