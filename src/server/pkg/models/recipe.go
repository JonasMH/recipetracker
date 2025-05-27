package models

type Recipe struct {
	Id          string             `json:"id"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Ingredients []RecipeIngredient `json:"ingredients"`
}

type RecipeIngredient struct {
	Name     string  `json:"name"`
	Quantity float32 `json:"quantity"`
	Unit     string  `json:"unit"`
}

type RecipeLog struct {
	Id                string             `json:"id"`
	RecipeId          string             `json:"recipeId"`
	Description       string             `json:"description"`
	ActualIngredients []RecipeIngredient `json:"actualIngredients"`
	Commit            *Commit            `json:"commit"`
}

type CommitAuthor struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	When  string `json:"when"`
}

type Commit struct {
	Hash      string       `json:"hash"`
	Author    CommitAuthor `json:"author"`
	Committer CommitAuthor `json:"committer"`
	Message   string       `json:"message"`
}
