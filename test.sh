invoke_url='https://integrate.api.nvidia.com/v1/chat/completions'

authorization_header='Authorization: Bearer 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'
accept_header='Accept: application/json'
content_type_header='Content-Type: application/json'

data=$(cat <<'JSON'
{
  "model": "z-ai/glm4.7",
  "messages": [
    {
      "role": "user",
      "content": "hola, que tal?"
    }
  ],
  "temperature": 1,
  "top_p": 1,
  "max_tokens": 16384,
  "seed": 42,
  "stream": true,
  "chat_template_kwargs": {
    "enable_thinking": true,
    "clear_thinking": false
  }
}
JSON
)

response=$(curl --silent -i -w "\n%{http_code}" --request POST \
  --url "$invoke_url" \
  --header "$authorization_header" \
  --header "$accept_header" \
  --header "$content_type_header" \
  --data "$data"
)

echo "$response"