


run:
	@templ generate
	@go run cmd/main.go

build:
	@go build -o bin/recipetracker ./cmd/main.go

watch:
	make -j5 watch/templ watch/server watch/tailwind watch/sync_assets

watch/templ:
	templ generate --watch --proxy="http://localhost:8080" --open-browser=false -v

# run air to detect any go file changes to re-build and re-run the server.
watch/server:
	CGO_CFLAGS="-O2 -Wno-error" go run github.com/cosmtrek/air@v1.51.0 \
	--build.cmd "go build -o bin/recipetracker cmd/main.go" --build.bin "bin/recipetracker" --build.delay "100" \
	--build.exclude_dir "node_modules" \
	--build.include_ext "go" \
	--build.stop_on_error "false" \
	--misc.clean_on_exit true

# run tailwindcss to generate the styles.css bundle in watch mode.
watch/tailwind:
	npx --yes tailwindcss -i ./input.css -o ./assets/styles.css --minify --watch

# watch for any js or css change in the assets/ folder, then reload the browser via templ proxy.
watch/sync_assets:
	go run github.com/cosmtrek/air@v1.51.0 \
	--build.cmd "templ generate --notify-proxy" \
	--build.bin "true" \
	--build.delay "100" \
	--build.exclude_dir "" \
	--build.include_dir "assets" \
	--build.include_ext "js,css"