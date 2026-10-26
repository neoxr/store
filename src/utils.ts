export const noSuffix = (str: string): string => (str?.includes(':') && str?.includes('@')) ? `${str.split('@')[0].split(':')[0]}@${str.split('@')[1]}` : str

export const getKeyAuthor = (key: any, meId: string = 'me') => (
    (key?.fromMe ? meId : (key?.senderPn || key?.participantPn || key.participant || key.remoteJid)) || ''
)

export const senderPatterns = (sender: string): string[] => {
    if (!sender) return []
    const normalized = noSuffix(sender)
    const at = normalized.lastIndexOf('@')
    if (at === -1) return [normalized]

    return [
        normalized,
        `${normalized.slice(0, at)}:%@${normalized.slice(at + 1)}`
    ]
}

export const isFromSender = (msg: any, sender: string): boolean => {
    if (!msg || typeof msg !== 'object' || !sender) return false

    const target = noSuffix(sender)
    const key = msg.key || {}
    const candidates = [
        msg.sender,
        key.senderPn,
        key.participantPn,
        key.participant,
        ...(key.fromMe ? [] : [key.remoteJid])
    ]

    return candidates.some(value => typeof value === 'string' && value.length > 0 && noSuffix(value) === target)
}