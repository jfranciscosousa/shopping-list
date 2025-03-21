export async function categorizeItem(item: string): Promise<string> {
  try {
    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.category
  } catch (error) {
    console.error("Error in categorization:", error)
    return "Other"
  }
}

