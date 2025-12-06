# Upgrade Plan for SafeGram

We will implement the following upgrades:

## 1. Real-Time Experience (Priority: High)
- [x] **Real-Time Chat**: Implement Supabase Realtime subscriptions in the client to receive messages instantly.
- [x] **Typing Indicators**: Use Supabase Presence to show when users are typing.

## 2. Advanced AI Features (Priority: High)
- [x] **AI Smart Replies**: Add backend endpoint to suggest replies using Groq/Llama 3. Integrate into UI.

## 3. Engineering Robustness (Priority: Medium)
- [x] **Input Validation**: Integrate `zod` for request validation in the backend.

## 4. DevOps (Priority: Low)
- [x] **Docker Support**: Create Dockerfiles and docker-compose.yml.

## 5. Performance (Priority: Medium)
- [x] **Virtual Scrolling**: Optimize the feed for large lists.
- [x] **PWA Support**: Make the app installable.

---
**Current Focus**: Real-Time Chat & AI Smart Replies.
