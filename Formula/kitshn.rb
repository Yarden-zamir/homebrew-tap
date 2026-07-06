# typed: false
# frozen_string_literal: true

class Kitshn < Formula
  desc "Small VPS deployment system for GitHub repos"
  homepage "https://github.com/Yarden-zamir/kitshn"
  url "https://github.com/Yarden-zamir/kitshn/archive/refs/tags/v0.1.2.tar.gz"
  sha256 "f4cd05a14a01e55de394e09001d4da2b174b648a9cf806ad2dc716e5048782cf"
  license "MIT"
  head "https://github.com/Yarden-zamir/kitshn.git", branch: "main"

  depends_on "uv"

  def install
    libexec.install "src"
    (bin/"kitshn").write <<~SH
      #!/bin/bash
      export PYTHONPATH="#{libexec}/src${PYTHONPATH:+:$PYTHONPATH}"
      export KITSHN_SOURCE_REF="v0.1.2"
      exec "#{formula_opt_bin("uv")}/uv" run --no-project --python 3.14 \
        --with 'cyclopts>=4.16.0' \
        --with 'jinja2>=3.1.6' \
        --with 'pyyaml>=6.0.3' \
        -m kitshn "$@"
    SH
    chmod 0755, bin/"kitshn"
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/kitshn --help")
  end
end
