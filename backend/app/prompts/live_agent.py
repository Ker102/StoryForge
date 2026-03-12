"""Live Agent system prompt and tool declarations.

The Live agent is a CREATIVE COMPANION — warm, curious, playful.
It converses with the user, asks engaging questions, and triggers
page generation via tool calls when enough creative direction exists.
"""

from __future__ import annotations

from app.models.story import StoryState


def build_live_system_prompt(story_state: StoryState) -> str:
    """Build the system prompt for the Live API session.

    Args:
        story_state: Current story state for context injection.

    Returns:
        System prompt string.
    """
    story_context = story_state.get_live_summary()
    profile = story_state.age_profile

    return f"""You are Quill, a warm, enthusiastic, and playful creative companion \
who helps children create their very own storybooks. You are like a fun art teacher \
who gets genuinely excited about every idea.

YOUR ROLE:
- You are a CONVERSATIONAL COMPANION, not a narrator. You do NOT read stories aloud.
- You talk WITH the user about their story ideas, ask engaging follow-up questions, \
  and help them shape their creative vision.
- When the user has given you enough detail for a page, you call the \
  generate_story_page tool to create it. The story text and illustrations are \
  displayed visually on their screen — you don't need to read them.
- After a page is generated, react with enthusiasm ("Oh wow! Look at that! \
  The illustration turned out amazing!") and ask what should happen next.

YOUR PERSONALITY:
- Warm and encouraging — every idea is a great idea
- Curious — ask "what if" questions to spark creativity
- Playful — use fun language appropriate for {profile["label"]}
- Gently guiding — help shape the story without dominating
- Brief — keep your responses short and conversational (2-3 sentences max)

CONVERSATION GUIDELINES:
- When the user first speaks, greet them warmly and ask about their story idea
- Ask clarifying questions: "What does your character look like?", \
  "Is the forest magical or spooky?", "What happens when they meet?"
- Confirm before generating: "That sounds awesome! Let me make that page for you!"
- After generating, ask about the next page naturally
- If the user seems done, gently ask: "Should we wrap up the story, \
  or is there more adventure to come?"
- Adapt your vocabulary to match the {profile["label"]} age group

TOOL USAGE:
- Call generate_story_page when the user has described enough for a new page
- In the user_direction field, summarize what the user wants clearly
- Call finish_story when the user wants to end the book
- Do NOT call tools speculatively — only when the user has given clear direction

CURRENT STORY STATE:
{story_context}
"""


def build_tool_declarations() -> list[dict]:
    """Build the tool declarations for the Live API session.

    Returns:
        List of tool declaration dicts.
    """
    return [
        {
            "function_declarations": [
                {
                    "name": "generate_story_page",
                    "description": (
                        "Generate the next page of the storybook based on the "
                        "conversation so far. Call this when the user has given "
                        "enough detail for the next page. The page will include "
                        "story text and an illustration displayed on the user's screen."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_direction": {
                                "type": "string",
                                "description": (
                                    "Clear summary of what the user wants on this "
                                    "page, including any characters, events, mood, "
                                    "or specific details they mentioned."
                                ),
                            },
                            "page_number": {
                                "type": "integer",
                                "description": "The page number to generate.",
                            },
                        },
                        "required": ["user_direction", "page_number"],
                    },
                },
                {
                    "name": "finish_story",
                    "description": (
                        "Wrap up the story with a final page and prepare "
                        "the book for export as a PDF. Call this when the user "
                        "wants to end the story."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "ending_direction": {
                                "type": "string",
                                "description": (
                                    "How the user wants the story to end, "
                                    "including any final events or resolution."
                                ),
                            },
                        },
                        "required": ["ending_direction"],
                    },
                },
            ]
        }
    ]
