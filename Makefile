build:
	@rm -rf bin
	@cd src/server && go build -o ../../bin/recipetracker cmd/main.go
	@cd src/server && cp prod-config.yaml ../../bin/config.yaml
	@cd src/client && npm run build && mv build/client ../../bin/public

watch:
	make -j2 watch/server watch/client

watch/server:
	@cd src/server && CGO_CFLAGS="-O2 -Wno-error" go run github.com/cosmtrek/air@v1.51.0 \
	--build.cmd "go build -o bin/recipetracker cmd/main.go" --build.bin "bin/recipetracker" --build.delay "100" \
	--build.exclude_dir "node_modules" \
	--build.include_ext "go" \
	--build.stop_on_error "false" \
	--misc.clean_on_exit true

watch/client:
	@cd src/client && npm run dev